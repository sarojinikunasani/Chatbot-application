// client/src/components/chat/ConfirmationModal.js
import React from 'react';
import './ConfirmationModal.css'; // Ensure this CSS file exists in the same 'chat' folder

const ConfirmationModal = ({
    isOpen,
    message,
    onConfirm,
    onCancel,
    confirmText = "Yes",
    cancelText = "No"
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="modal-button confirm-button">
                        {confirmText}
                    </button>
                    <button onClick={onCancel} className="modal-button cancel-button">
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
