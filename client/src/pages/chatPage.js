import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './chatPage.css';
const API_CHAT_URL = http://localhost:${process.env.REACT_APP_SERVER_PORT || 5002}/api/chat;
function ChatPage() {
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [isLoadingHistory, setIsLoadingHistory] = useState(true);
const [isSending, setIsSending] = useState(false);
const [error, setError] = useState('');
const messagesEndRef = useRef(null);
const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};

useEffect(() => {
    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Not authorized.'); return;
            }
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const response = await axios.get(`${API_CHAT_URL}/history`, config);
            setMessages(response.data);
        } catch (err) {
            console.error("Error fetching chat history:", err);
            setError(err.response?.data?.message || 'Failed to fetch chat history.');
        } finally {
            setIsLoadingHistory(false);
        }
    };
    fetchHistory();
}, []);

useEffect(() => {
    scrollToBottom();
}, [messages]);


const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    setError('');
    const tempMessageId = `temp-${Date.now()}`; 
    const messageToSend = newMessage.trim();

    setMessages(prevMessages => [
        ...prevMessages,
        { id: tempMessageId, user_id: 'current_user', message_text: messageToSend, sent_at: new Date().toISOString(), isOptimistic: true }
    ]);
    setNewMessage(''); 

    try {
        const token = localStorage.getItem('authToken');
        if (!token) { throw new Error('No auth token found'); }

        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const response = await axios.post(`${API_CHAT_URL}/messages`, { messageText: messageToSend }, config);
        
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.id === tempMessageId ? { ...response.data, isOptimistic: false } : msg
            )
        );

    } catch (err) {
        console.error("Error sending message:", err);
        setError(err.response?.data?.message || 'Failed to send message.');
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessageId));
    } finally {
        setIsSending(false);
    }
};

return (
    <div className="chat-page-container">
        <div className="chat-header">
            <h2>My Chat</h2>
        </div>
        <div className="chat-messages-area">
            {isLoadingHistory && <p className="loading-history">Loading history...</p>}
            {error && <p className="chat-error-message">{error}</p>}
            {!isLoadingHistory && messages.length === 0 && !error && (
                <p className="no-messages">No messages yet. Start chatting!</p>
            )}
            {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.isOptimistic ? 'optimistic' : ''} user-message`}>
                    {/* In a real multi-user chat, you'd differentiate user vs bot/other user messages */}
                    <div className="message-bubble">
                        <p className="message-text">{msg.message_text}</p>
                        <span className="message-timestamp">
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} /> {/* Empty div to scroll to */}
        </div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                disabled={isSending || isLoadingHistory}
            />
            <button type="submit" disabled={isSending || isLoadingHistory || !newMessage.trim()}>
                {isSending ? 'Sending...' : 'Send'}
            </button>
        </form>
    </div>
);
}
export default ChatPage;
