// client/src/pages/Profile.js
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import './Profile.css';

function Profile() {
    const outletContext = useOutletContext();
    // It's good practice to check if outletContext is null before destructuring
    const loggedInUser = outletContext ? outletContext.loggedInUser : null;

    // VVVVV --- CRITICAL LOGGING --- VVVVV
    console.log("****************************************************");
    console.log("(Profile.js) ENTIRE OUTLET CONTEXT RECEIVED:", outletContext);
    console.log("(Profile.js) LOGGEDINUSER EXTRACTED FROM CONTEXT:", loggedInUser);
    if (loggedInUser) {
        console.log("(Profile.js) loggedInUser.id:", loggedInUser.id);
        console.log("(Profile.js) loggedInUser.username:", loggedInUser.username);
        console.log("(Profile.js) loggedInUser.email:", loggedInUser.email);
        console.log("(Profile.js) loggedInUser.phone_number:", loggedInUser.phone_number);
        console.log("(Profile.js) loggedInUser.created_at:", loggedInUser.created_at);
    } else {
        console.log("(Profile.js) loggedInUser is NULL or UNDEFINED in context when trying to render.");
    }
    console.log("****************************************************");
    // ^^^^^ --- CRITICAL LOGGING --- ^^^^^


    if (!loggedInUser) {
        // This state might occur briefly during loading or if context is not passed/updated correctly
        return (
            <div className="profile-container">
                <h2>My Profile</h2>
                <div>Loading profile data or user is not available...</div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <h2>My Profile</h2>
            <div className="profile-details">
                <div className="detail-item">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{loggedInUser.username}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{loggedInUser.email || 'Not provided (Profile.js)'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Phone Number:</span>
                    <span className="detail-value">{loggedInUser.phone_number || 'Not provided (Profile.js)'}</span>
                </div>
                 <div className="detail-item">
                    <span className="detail-label">Member Since:</span>
                    <span className="detail-value">
                        {loggedInUser.created_at
                            ? new Date(loggedInUser.created_at).toLocaleDateString()
                            : 'N/A (Profile.js)'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Profile;
