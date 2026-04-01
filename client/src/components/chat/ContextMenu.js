// client/src/components/ContextMenu.js (or client/src/components/Chat/ContextMenu.js)
import React from 'react';
import './ContextMenu.css'; // Ensure this CSS file exists

const ContextMenu = ({
    x,
    y,
    conversationId,
    isArchivedView,
    onRename,
    onDelete,
    onArchive,
    onClose
}) => {
    if (x === null || y === null || !conversationId) {
        return null;
    }

    const handleAction = (actionCallback) => {
        if (actionCallback) {
            actionCallback(conversationId);
        }
        onClose();
    };

    return (
        <div
            className="context-menu"
            style={{ top: `${y}px`, left: `${x}px` }}
            onClick={(e) => e.stopPropagation()}
        >
            <ul>
                {!isArchivedView && <li onClick={() => handleAction(onRename)}>Rename</li>}
                {isArchivedView ? (
                    <li onClick={() => handleAction(onArchive)}>Unarchive</li>
                ) : (
                    <li onClick={() => handleAction(onArchive)}>Archive</li>
                )}
                {!isArchivedView && <li onClick={() => handleAction(onDelete)} className="delete-option">Delete</li>}
            </ul>
        </div>
    );
};

export default ContextMenu;
