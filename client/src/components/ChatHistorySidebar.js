import React from 'react';
import { FiPlus, FiArrowLeft, FiMoreHorizontal, FiArchive, FiMessageSquare, FiEdit2 } from 'react-icons/fi';
import { BsChatLeft } from 'react-icons/bs';
import './ChatHistorySidebar.css';

const HistoryItem = ({
    convo,
    isActive,
    onSelect,
    onShowContextMenu,
    isRenamingThis,
    renameValue,
    setRenameValue,
    onRenameSave,
    onRenameCancel
}) => {
    const handleItemClick = () => {
        if (isRenamingThis) return;
        onSelect(convo.conversation_id);
    };

    const handleDotsClick = (e) => {
        e.stopPropagation();
        onShowContextMenu(e, convo.conversation_id);
    };

    const handleRenameSubmit = (e) => {
        e.preventDefault();
        onRenameSave();
    };

    const handleRenameInputKeyDown = (e) => {
        if (e.key === 'Escape') {
            onRenameCancel();
        }
    };

    const displayTitle = (title) => {
        if (!title) return "Untitled Chat";
        return title.length > 25 ? title.substring(0, 22) + "..." : title;
    };

    if (isRenamingThis) {
        return (
            <li className={`history-item renaming ${isActive ? 'active' : ''}`}>
                <form onSubmit={handleRenameSubmit} className="rename-form">
                    <FiEdit2 className="rename-icon" />
                    <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => setTimeout(onRenameCancel, 150)}
                        onKeyDown={handleRenameInputKeyDown}
                        autoFocus
                        className="rename-input"
                    />
                </form>
            </li>
        );
    }

    return (
        <li
            key={convo.conversation_id}
            className={`history-item ${isActive ? 'active' : ''}`}
            onClick={handleItemClick}
            title={convo.conversation_title || 'Chat'}
            onContextMenu={(e) => onShowContextMenu(e, convo.conversation_id)}
        >
            <BsChatLeft className="history-item-icon" />
            <span className="history-item-text">{displayTitle(convo.conversation_title)}</span>
            <button
                className="item-actions-button"
                onClick={handleDotsClick}
                title="More options"
            >
                <FiMoreHorizontal />
            </button>
        </li>
    );
};

function ChatHistorySidebar({
    conversations = [],
    isLoading,
    onSelectConversation,
    onNewChat,
    activeConversationId,
    historyView,
    setHistoryView,
    onShowContextMenu,
    isRenamingId,
    onRenameCancel,
    onRenameSave,
    renameValue,
    setRenameValue,
    isArchivedView,
    onGoToDashboard
}) {
    const groupedConversations = conversations.reduce((acc, convo) => {
        if (!convo || !convo.last_message_time) return acc;
        const msgDate = new Date(convo.last_message_time);
        const today = new Date(); today.setHours(0,0,0,0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);

        let dateLabel;
        if (msgDate >= today) { dateLabel = 'Today'; }
        else if (msgDate >= yesterday) { dateLabel = 'Yesterday'; }
        else if (msgDate >= sevenDaysAgo) { dateLabel = 'Previous 7 Days'; }
        else { dateLabel = msgDate.toLocaleDateString([], { month: 'long', year: 'numeric' });}

        if (!acc[dateLabel]) {
            acc[dateLabel] = { label: dateLabel, conversations: [] };
        }
        acc[dateLabel].conversations.push(convo);
        return acc;
    }, {});

    const displayOrderOfDateGroups = ['Today', 'Yesterday', 'Previous 7 Days']
        .filter(label => groupedConversations[label])
        .concat(
            Object.keys(groupedConversations)
                .filter(label => !['Today', 'Yesterday', 'Previous 7 Days'].includes(label))
                .sort((a, b) => {
                    const dateA = new Date(a.includes(" ") ? a.split(" ").pop() : a);
                    const dateB = new Date(b.includes(" ") ? b.split(" ").pop() : b);
                    return dateB - dateA;
                })
        );

    return (
        <div className="chat-history-sidebar">
            <div className="history-header">
                <div className="sidebar-top-actions">
                    <button
                        className="dashboard-back-button"
                        onClick={onGoToDashboard}
                        title="Back to Dashboard"
                    >
                        <FiArrowLeft />
                    </button>
                    <button className="new-chat-button" onClick={onNewChat} title="Start a new chat">
                        <FiPlus className="new-chat-icon" />
                        New Chat
                    </button>
                </div>
                <div className="view-toggle-buttons">
                    <button
                        onClick={() => setHistoryView('active')}
                        className={historyView === 'active' ? 'active-view' : ''}
                        title="View active chats"
                    >
                        <FiMessageSquare /> Active
                    </button>
                    <button
                        onClick={() => setHistoryView('archived')}
                        className={historyView === 'archived' ? 'active-view' : ''}
                        title="View archived chats"
                    >
                        <FiArchive /> Archived
                    </button>
                </div>
            </div>
            <div className="history-list">
                {isLoading && <p className="history-loading">Loading...</p>}
                {!isLoading && displayOrderOfDateGroups.length === 0 && conversations.length > 0 && (
                    <p className="no-history">Processing history...</p>
                )}
                {!isLoading && displayOrderOfDateGroups.map((dateLabelKey) => {
                    const group = groupedConversations[dateLabelKey];
                    if (!group || group.conversations.length === 0) return null;
                    return (
                        <div key={group.label} className="history-group">
                            <h4 className="history-date-header">{group.label}</h4>
                            <ul>
                                {group.conversations.map(convo => (
                                    <HistoryItem
                                        key={convo.conversation_id}
                                        convo={convo}
                                        isActive={activeConversationId === convo.conversation_id}
                                        onSelect={onSelectConversation}
                                        onShowContextMenu={onShowContextMenu}
                                        isRenamingThis={isRenamingId === convo.conversation_id}
                                        renameValue={isRenamingId === convo.conversation_id ? renameValue : ''}
                                        setRenameValue={setRenameValue}
                                        onRenameSave={onRenameSave}
                                        onRenameCancel={onRenameCancel}
                                        isArchivedView={isArchivedView}
                                    />
                                ))}
                            </ul>
                        </div>
                    );
                })}
                 {!isLoading && conversations.length === 0 &&
                    <p className="no-history">
                        {historyView === 'active' ? "No active chats found." : "No archived chats found."}
                    </p>
                 }
            </div>
             <div className="sidebar-footer">
             </div>
        </div>
    );
}

export default ChatHistorySidebar;
