import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BsMicFill, BsArrowUpShort } from "react-icons/bs";
import "./ChatInterface.css";

function ChatInterface({ messages = [], activeConversationId }) {

  const [chatMessages, setChatMessages] = useState(messages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isBotTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const messageText = newMessage.trim();
    if (!messageText || isSending) return;

    setIsSending(true);
    setIsBotTyping(true);

    const optimisticUserMessage = {
      id: Date.now(),
      sender_type: "user",
      message_text: messageText,
      sent_at: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, optimisticUserMessage]);
    setNewMessage("");

    try {

      const token = localStorage.getItem("authToken");

      const response = await axios.post(
        "http://localhost:5002/api/chat/messages",
        {
          messageText: messageText,
          conversationId: activeConversationId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const botMessage = response.data;

      setChatMessages((prev) => [...prev, botMessage]);

    } catch (error) {

      console.error("Chat error:", error);

      const errorMessage = {
        id: Date.now() + 1,
        sender_type: "bot",
        message_text: "⚠️ Server error. Please try again."
      };

      setChatMessages((prev) => [...prev, errorMessage]);

    } finally {
      setIsSending(false);
      setIsBotTyping(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="chat-interface">

      <div className="chat-messages-display-area">

        {chatMessages.length === 0 && (
          <div className="chat-welcome">
            <h2>Ask me anything 🤖</h2>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`message-wrapper ${
              msg.sender_type === "bot"
                ? "bot-message"
                : "user-message"
            }`}
          >
            <div className="message-bubble">
              <p className="message-text">{msg.message_text}</p>
            </div>
          </div>
        ))}

        {isBotTyping && (
          <div className="message-wrapper bot-message">
            <div className="message-bubble typing-indicator">
              <p className="message-text">
                <em>Bot is typing...</em>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>

      </div>

      <div className="chat-input-area">

        <form className="chat-input-form" onSubmit={handleSendMessage}>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask anything..."
            disabled={isSending}
          />

          <button
            type="button"
            className="input-action-button mic-button"
          >
            <BsMicFill />
          </button>

          <button
            type="submit"
            className="send-button"
            disabled={!newMessage.trim()}
          >
            <BsArrowUpShort />
          </button>

        </form>

      </div>

    </div>
  );
}

export default ChatInterface;