const express = require('express');
const router = express.Router();

const {
    saveChatMessage,
    getChatHistory,
    getConversationMessages,
    renameConversation,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    getArchivedHistory
} = require('../controllers/chatController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/messages', authMiddleware, saveChatMessage);

router.get('/history', authMiddleware, getChatHistory);

router.get('/conversation/:conversationId', authMiddleware, getConversationMessages);

router.put('/conversations/:conversationId/rename', authMiddleware, renameConversation);

router.delete('/conversations/:conversationId', authMiddleware, deleteConversation);

router.put('/conversations/:conversationId/archive', authMiddleware, archiveConversation);

router.put('/conversations/:conversationId/unarchive', authMiddleware, unarchiveConversation);

router.get('/history/archived', authMiddleware, getArchivedHistory);

module.exports = router;
