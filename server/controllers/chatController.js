const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const saveChatMessageAndGetResponse = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication failed.' });
    }
    const userId = req.user.id;
    let { conversationId, messageText, tag } = req.body;

    if (!messageText || messageText.trim() === "") {
        return res.status(400).json({ message: 'Message text cannot be empty' });
    }
    const userMessageText = messageText.trim();
    let currentConversationId = conversationId;
    let conversationTitleToSave = null;

    if (!currentConversationId) {
        currentConversationId = uuidv4();
        conversationTitleToSave = userMessageText.split(' ').slice(0, 7).join(' ') + (userMessageText.split(' ').length > 7 ? '...' : '');
    }

    try {
        const userMessageQuery = `
            INSERT INTO chat_messages (user_id, message_text, conversation_id, conversation_title, sender_type, is_archived)
            VALUES ($1, $2, $3, $4, 'user', FALSE)
            RETURNING id, user_id, message_text, sent_at, conversation_id, conversation_title, sender_type, is_archived`;
        const userResult = await pool.query(userMessageQuery, [userId, userMessageText, currentConversationId, conversationTitleToSave]);
        const savedUserMessage = userResult.rows[0];

        let llmResponseText = "I am a demo bot. Fallback response.";
        
        if (process.env.LLM_API_ENDPOINT) {
            try {
                const llmApiHeaders = { 'Content-Type': 'application/json' };
                if (process.env.LLM_API_KEY) {
                    llmApiHeaders['Authorization'] = `Bearer ${process.env.LLM_API_KEY}`;
                }
                
                const llmPayload = { message: userMessageText };
                if (tag) llmPayload.tag = tag;
                
                const llmApiResponse = await axios.post(
                    process.env.LLM_API_ENDPOINT,
                    llmPayload,
                    { headers: llmApiHeaders, timeout: 30000 }
                );
                
                if (typeof llmApiResponse.data === 'string' && llmApiResponse.data.trim() !== "") {
                    llmResponseText = llmApiResponse.data.trim();
                } else {
                     llmResponseText = "LLM returned an empty or unexpected response.";
                }
            } catch (llmError) {
                console.error("Error calling LLM server:", llmError.message);
                llmResponseText = "Sorry, AI connection error. Fallback used.";
                if (llmError.code === 'ECONNABORTED') {
                    llmResponseText = "Sorry, the AI took too long to respond.";
                } else if (llmError.response && llmError.response.status) {
                     llmResponseText = `AI service error (${llmError.response.status}). Fallback used.`;
                }
            }
        } else {
            console.warn("LLM_API_ENDPOINT not configured.");
        }

        const botMessageQuery = `
            INSERT INTO chat_messages (user_id, message_text, conversation_id, sender_type, is_archived) 
            VALUES ($1, $2, $3, 'bot', FALSE) 
            RETURNING id, user_id, message_text, sent_at, conversation_id, sender_type, is_archived`;
        const botResult = await pool.query(botMessageQuery, [userId, llmResponseText, currentConversationId]);
        const savedBotMessage = botResult.rows[0];

        res.status(201).json(savedBotMessage);

    } catch (dbError) {
        console.error(`DB or Unhandled ERROR for user ${userId} (Convo ID: ${currentConversationId}):`, dbError.message, dbError.stack);
        res.status(500).json({ message: 'Server error processing your chat message' });
    }
};

const fetchHistoryByArchiveStatus = async (userId, isArchivedStatus) => {
    const statusType = isArchivedStatus ? "Archived" : "Active";
    try {
        const historyQuery = `
            WITH RelevantConversations AS (
                SELECT DISTINCT conversation_id
                FROM chat_messages
                WHERE user_id = $1 AND is_archived = $2
            ),
            RankedMessages AS (
                SELECT
                    cm.conversation_id,
                    cm.conversation_title,
                    cm.sent_at,
                    cm.sender_type,
                    ROW_NUMBER() OVER (PARTITION BY cm.conversation_id ORDER BY cm.sent_at ASC) as rn_first_message,
                    ROW_NUMBER() OVER (PARTITION BY cm.conversation_id ORDER BY cm.sent_at DESC) as rn_last_message
                FROM chat_messages cm
                INNER JOIN RelevantConversations rc ON cm.conversation_id = rc.conversation_id
                WHERE cm.user_id = $1
            ),
            ConversationTitles AS (
                SELECT
                    conversation_id,
                    conversation_title
                FROM RankedMessages
                WHERE rn_first_message = 1 AND sender_type = 'user' AND conversation_title IS NOT NULL
            ),
            LastMessageTimes AS (
                SELECT
                    conversation_id,
                    sent_at as last_message_time
                FROM RankedMessages
                WHERE rn_last_message = 1
            )
            SELECT
                rc.conversation_id,
                COALESCE(ct.conversation_title, 'Untitled Chat') as conversation_title,
                lmt.last_message_time,
                $2 AS is_archived
            FROM RelevantConversations rc
            LEFT JOIN ConversationTitles ct ON rc.conversation_id = ct.conversation_id
            LEFT JOIN LastMessageTimes lmt ON rc.conversation_id = lmt.conversation_id
            WHERE lmt.last_message_time IS NOT NULL
            ORDER BY lmt.last_message_time DESC;`;
        const { rows } = await pool.query(historyQuery, [userId, isArchivedStatus]);
        return rows;
    } catch (err) {
        console.error(`SERVER ERROR fetching ${statusType.toLowerCase()} history for user ${userId}:`, err.message, err.stack);
        throw err;
    }
};

const getChatHistory = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication failed.' });
    }
    try {
        const activeConversations = await fetchHistoryByArchiveStatus(req.user.id, false);
        res.json(activeConversations);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching active conversation list.' });
    }
};

const getArchivedHistory = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication failed.' });
    }
    try {
        const archivedConversations = await fetchHistoryByArchiveStatus(req.user.id, true);
        res.json(archivedConversations);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching archived conversation list.' });
    }
};

const getConversationMessages = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication failed.' });
    }
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!conversationId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(conversationId)) {
        return res.status(400).json({ message: 'Valid Conversation ID is required.' });
    }
    try {
        const messagesQuery = `
            SELECT id, user_id, message_text, sent_at, conversation_id, conversation_title, sender_type, is_archived
            FROM chat_messages
            WHERE user_id = $1 AND conversation_id = $2
            ORDER BY sent_at ASC`;
        const { rows } = await pool.query(messagesQuery, [userId, conversationId]);
        res.json(rows);
    } catch (err) {
        console.error(`SERVER ERROR fetching messages for convo ${conversationId} (User ${userId}):`, err.message, err.stack);
        res.status(500).json({ message: 'Server error fetching conversation messages' });
    }
};

const renameConversation = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication failed.' });
    }
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { newTitle } = req.body;

    if (!newTitle || newTitle.trim() === "") {
        return res.status(400).json({ message: 'New title cannot be empty.' });
    }
    if (!conversationId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(conversationId)) {
        return res.status(400).json({ message: 'Valid Conversation ID is required.' });
    }
    const trimmedNewTitle = newTitle.trim();

    try {
        const firstMessageIdQuery = `
            SELECT id FROM chat_messages
            WHERE conversation_id = $1 AND user_id = $2 AND sender_type = 'user'
            ORDER BY sent_at ASC
            LIMIT 1;`;
        const firstMessageResult = await pool.query(firstMessageIdQuery, [conversationId, userId]);

        if (firstMessageResult.rows.length === 0) {
            return res.status(404).json({ message: 'Conversation not found or no message to set title on.' });
        }
        const messageIdToUpdate = firstMessageResult.rows[0].id;

        const updateQuery = `
            UPDATE chat_messages
            SET conversation_title = $1
            WHERE id = $2 AND user_id = $3 AND conversation_id = $4 
            RETURNING conversation_id, conversation_title;`;
        const { rows, rowCount } = await pool.query(updateQuery, [trimmedNewTitle, messageIdToUpdate, userId, conversationId]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Failed to update title. Conversation or message not found, or user does not own it.' });
        }
        res.json({ conversationId: rows[0].conversation_id, newTitle: rows[0].conversation_title });
    } catch (err) {
        console.error(`SERVER ERROR renaming Convo ${conversationId} for User ${userId}:`, err.message, err.stack);
        res.status(500).json({ message: 'Server error renaming conversation.' });
    }
};

const deleteConversation = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User authentication failed.' });
    }
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!conversationId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(conversationId)) {
        return res.status(400).json({ message: 'Valid Conversation ID is required.' });
    }

    try {
        const deleteQuery = `
            DELETE FROM chat_messages
            WHERE conversation_id = $1 AND user_id = $2
            RETURNING conversation_id;`;
        const result = await pool.query(deleteQuery, [conversationId, userId]);

        if (result.rowCount === 0) {
            return res.status(200).json({ message: 'No messages found for this conversation belonging to the user, or it was already deleted.', conversationId });
        }
        res.json({ message: `Conversation deleted successfully (${result.rowCount} messages).`, conversationId });
    } catch (err) {
        console.error(`SERVER ERROR deleting Convo ${conversationId} for User ${userId}:`, err.message, err.stack);
        res.status(500).json({ message: 'Server error deleting conversation.' });
    }
};

const setConversationArchiveStatus = async (userId, conversationId, archiveStatus) => {
    const action = archiveStatus ? "archive" : "unarchive";
    console.log(`(Controller/setArchiveStatus) User ${userId} attempting to ${action} Convo ${conversationId}`);

    const updateQuery = `
        UPDATE chat_messages
        SET is_archived = $1
        WHERE conversation_id = $2 AND user_id = $3
        RETURNING conversation_id;`;
    const result = await pool.query(updateQuery, [archiveStatus, conversationId, userId]);

    if (result.rowCount === 0) {
        console.warn(`(Controller/setArchiveStatus) No messages found to ${action} for Convo ${conversationId}, User ${userId}.`);
        throw new Error('Conversation not found or user does not own it.');
    }
    console.log(`(Controller/setArchiveStatus) Convo ${conversationId} successfully ${action}d by User ${userId} (${result.rowCount} messages updated).`);
    return { message: `Conversation ${action}d successfully.`, conversationId, is_archived: archiveStatus };
};

const archiveConversation = async (req, res) => {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'User authentication failed.' });
    const { conversationId } = req.params;
     if (!conversationId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(conversationId)) {
        return res.status(400).json({ message: 'Valid Conversation ID is required.' });
    }
    try {
        const result = await setConversationArchiveStatus(req.user.id, conversationId, true);
        res.json(result);
    } catch (err) {
        console.error(`SERVER ERROR archiving Convo ${conversationId} for User ${req.user.id}:`, err.message, err.stack);
        res.status(err.message.startsWith('Conversation not found') ? 404 : 500).json({ message: err.message || 'Server error archiving conversation.' });
    }
};

const unarchiveConversation = async (req, res) => {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'User authentication failed.' });
    const { conversationId } = req.params;
     if (!conversationId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(conversationId)) {
        return res.status(400).json({ message: 'Valid Conversation ID is required.' });
    }
    try {
        const result = await setConversationArchiveStatus(req.user.id, conversationId, false);
        res.json(result);
    } catch (err) {
        console.error(`SERVER ERROR unarchiving Convo ${conversationId} for User ${req.user.id}:`, err.message, err.stack);
        res.status(err.message.startsWith('Conversation not found') ? 404 : 500).json({ message: err.message || 'Server error unarchiving conversation.' });
    }
};

module.exports = {
    saveChatMessage: saveChatMessageAndGetResponse,
    getChatHistory,
    getConversationMessages,
    renameConversation,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    getArchivedHistory
};
