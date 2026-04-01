# 🤖 AI Chatbot Application

A full-stack AI chatbot application that allows users to interact with an AI model (LLM) in real-time.
The application includes authentication, chat history, and a clean interface similar to ChatGPT.

---

## 🚀 Features

* 💬 Real-time chat with AI
* 🧠 LLM integration using Ollama
* 📂 Chat history stored per user
* 🔐 Login & Registration (JWT Authentication)
* 📌 Sidebar with conversations (Active / Archived)
* ⚡ Responsive and modern UI

---

## 🛠️ Tech Stack

**Frontend**

* React.js
* CSS

**Backend**

* Node.js
* Express.js

**Database**

* PostgreSQL

**LLM Server**

* Flask (Python)
* Ollama

---

## 📁 Project Structure

```
chatbot-application
│
├── client/        # React frontend
├── server/        # Node.js backend
├── llmserver/     # Flask + LLM integration
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```
git clone https://github.com/sarojinikunasani/chatbot-application.git
cd chatbot-application
```

---

### 2️⃣ Backend Setup

```
cd server
npm install
npm start
```

---

### 3️⃣ Frontend Setup

```
cd client
npm install
npm start
```

---

### 4️⃣ LLM Server Setup

```
cd llmserver
source venv/bin/activate
python3 app.py
```

---

## 🌐 API Endpoints

* POST `/api/chat` → Send message to AI
* POST `/api/chat/messages` → Save chat message
* GET `/api/chat/history` → Fetch chat history
* GET `/api/chat/conversation/:id` → Get conversation messages

---

## 🎯 Key Highlights

* Built a complete **AI-powered chat system**
* Integrated **LLM (Ollama) with backend API**
* Designed **user-based chat history system**
* Implemented **secure authentication using JWT**
* Created a **ChatGPT-like UI with React**

---

## 👩‍💻 Author

**Sarojini Kunasani**
GitHub: https://github.com/sarojinikunasani

---

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub!
