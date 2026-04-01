import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global base styles
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css'; // <-- ADD THIS LINE

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
