import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatHistorySidebar from "../components/ChatHistorySidebar";
import ChatInterface from "../components/ChatInterface";
import ContextMenu from "../components/chat/ContextMenu";
import ConfirmationModal from "../components/chat/ConfirmationModal";

const API_BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT || 5002}/api`;

function ChatPageLayout() {

  const navigate = useNavigate();
  const layoutRef = useRef(null);

  const [activeConversations, setActiveConversations] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [historyView, setHistoryView] = useState("active");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [menuPosition, setMenuPosition] = useState({ x: null, y: null });
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState(null);

  /* ---------------- AUTH ---------------- */

  const getTokenConfig = useCallback(() => {

    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

  }, [navigate]);

  /* ---------------- FETCH CONVERSATIONS ---------------- */

  const fetchConversations = useCallback(async () => {

    const config = getTokenConfig();
    if (!config) return;

    try {

      setIsLoading(true);

      const endpoint =
        historyView === "archived"
          ? `${API_BASE_URL}/chat/history/archived`
          : `${API_BASE_URL}/chat/history`;

      const response = await axios.get(endpoint, config);

      setActiveConversations(response.data);

    } catch (err) {

      console.error(err);
      setError("Failed to load conversations.");

    } finally {

      setIsLoading(false);

    }

  }, [getTokenConfig, historyView]);

  /* ---------------- FETCH MESSAGES ---------------- */

  const fetchMessages = useCallback(async (conversationId) => {

    if (!conversationId) return;

    const config = getTokenConfig();
    if (!config) return;

    try {

      const response = await axios.get(
        `${API_BASE_URL}/chat/conversation/${conversationId}`,
        config
      );

      setCurrentMessages(response.data);

    } catch (err) {

      console.error(err);
      setError("Failed to load messages.");

    }

  }, [getTokenConfig]);

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ---------------- LOAD MESSAGES ---------------- */

  useEffect(() => {

    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }

  }, [activeConversationId, fetchMessages]);

  /* ---------------- NEW CHAT ---------------- */

  const handleNewChat = () => {

    setActiveConversationId(null);
    setCurrentMessages([]);

  };

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = () => {

    localStorage.removeItem("authToken");
    navigate("/login");

  };

  /* ---------------- CONTEXT MENU ---------------- */

  const handleShowContextMenu = (event, conversationId) => {

    event.preventDefault();

    setMenuPosition({
      x: event.clientX,
      y: event.clientY
    });

    setSelectedConversationId(conversationId);

  };

  const closeContextMenu = () => {

    setMenuPosition({ x: null, y: null });
    setSelectedConversationId(null);

  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = (conversationId) => {

    setModalMessage("Delete this conversation?");

    setModalAction(() => async () => {

      try {

        const config = getTokenConfig();
        if (!config) return;

        await axios.delete(
          `${API_BASE_URL}/chat/conversations/${conversationId}`,
          config
        );

        fetchConversations();
        setIsModalOpen(false);

      } catch (err) {
        console.error(err);
      }

    });

    setIsModalOpen(true);

  };

  /* ---------------- ARCHIVE / UNARCHIVE ---------------- */

  const handleArchive = async (conversationId) => {

    try {

      const config = getTokenConfig();
      if (!config) return;

      const endpoint =
        historyView === "archived"
          ? `${API_BASE_URL}/chat/conversations/${conversationId}/unarchive`
          : `${API_BASE_URL}/chat/conversations/${conversationId}/archive`;

      await axios.put(endpoint, {}, config);

      fetchConversations();

    } catch (err) {
      console.error(err);
    }

  };

  /* ---------------- RENAME ---------------- */

  const handleRename = async (conversationId) => {

    const newTitle = prompt("Enter new chat title");

    if (!newTitle) return;

    try {

      const config = getTokenConfig();
      if (!config) return;

      await axios.put(
        `${API_BASE_URL}/chat/conversations/${conversationId}/rename`,
        { newTitle },
        config
      );

      fetchConversations();

    } catch (err) {
      console.error(err);
    }

  };

  /* ---------------- UI ---------------- */

  return (

    <div
      ref={layoutRef}
      className="flex h-screen w-full bg-[#0d0d0d] text-gray-200 font-sans"
      onClick={closeContextMenu}
    >

      {/* SIDEBAR */}

      <aside className="w-72 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">

        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">
            AI Chat Portal
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">

          <ChatHistorySidebar
            conversations={activeConversations}
            isLoading={isLoading}
            onSelectConversation={(id) => setActiveConversationId(id)}
            onNewChat={handleNewChat}
            activeConversationId={activeConversationId}
            historyView={historyView}
            setHistoryView={setHistoryView}
            onShowContextMenu={handleShowContextMenu}
          />

        </div>

        <button
          onClick={handleLogout}
          className="m-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-all"
        >
          Logout
        </button>

      </aside>

      {/* MAIN CHAT AREA */}

      <main className="flex-1 flex flex-col bg-[#111111]">

        <div className="flex items-center justify-between p-4 border-b border-gray-800">

          <h2 className="text-lg font-semibold text-gray-100">

            {activeConversationId
              ? `Conversation ${activeConversationId}`
              : "New Conversation"}

          </h2>

          <button
            onClick={handleNewChat}
            className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
          >
            + New Chat
          </button>

        </div>

        <div className="flex-1 overflow-y-auto bg-[#0d0d0d]">

          <ChatInterface
            key={activeConversationId || "new"}
            messages={currentMessages}
            activeConversationId={activeConversationId}
            refreshHistory={fetchConversations}
          />

        </div>

      </main>

      {/* CONTEXT MENU */}

      <ContextMenu
        x={menuPosition.x}
        y={menuPosition.y}
        conversationId={selectedConversationId}
        isArchivedView={historyView === "archived"}
        onRename={handleRename}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onClose={closeContextMenu}
      />

      {/* CONFIRMATION MODAL */}

      <ConfirmationModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={() => setIsModalOpen(false)}
      />

    </div>

  );

}

export default ChatPageLayout;