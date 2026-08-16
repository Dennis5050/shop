# Nexus — Real-Time Social & Messaging Platform

[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.IO-6366f1.svg)](https://socket.io)
[![Node Version](https://img.shields.io/badge/Node.js-20%2B%20%7C%2022%2B-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4%2B-38bdf8.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade, full-stack **real-time social and messaging platform** built with the MERN stack and Socket.IO. Combines the high-performance usability of modern chat systems with a social community feed, real-time presence, multi-room group collaboration, delivery & read receipts, reactions, and instant notifications.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React + Vite Client                  │
│  (Chat UI, Feed, Presence, Group Admin, Media, Audio)   │
└──────────────┬─────────────────────────┬───────────────┘
               │ HTTP REST API           │ Socket.IO (WSS)
               ▼                         ▼
┌────────────────────────────────────────────────────────┐
│                   Express + Node.js                    │
│   (Auth, Route Handlers, Sockets Router, Rate Limiter) │
└──────────────┬─────────────────────────┬───────────────┘
               │                         │
               ▼                         ▼
┌────────────────────────┐    ┌────────────────────────┐
│    MongoDB Database    │    │  In-Memory Presence &  │
│  (Users, Chats, Posts) │    │  Multi-Device Socket   │
└────────────────────────┘    └────────────────────────┘
```

---

## 🚀 Key Features

* **💬 Private One-on-One Messaging**: Instant end-to-end messaging with typing indicators, delivery timestamps, read receipts, and reactions.
* **👥 Rich Group Conversations**: Multi-member group channels, administrator role management, member management, and group profile avatars.
* **🟢 Multi-Device Presence Engine**: Real-time online/offline tracking, last seen timestamps, and active multi-tab connection deduplication.
* **📰 Lightweight Social Feed**: Community posts, image attachments, comment threads, and instant real-time reactions.
* **🔔 Live Real-Time Notifications**: Instant Socket.IO event dispatches for incoming messages, mentions, contact invites, and post interactions.
* **🔍 Universal Search**: Multi-index search across users, contacts, conversations, messages, and social posts.
* **🛡️ Production Security**: JWT authentication, bcrypt password hashing, input sanitization, rate limiting, and CORS protection.

---

## 📁 Repository Structure

```text
├── client/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI & chat components
│   │   ├── pages/       # Route views (Chat, Feed, Profile, Contacts)
│   │   ├── hooks/       # Custom React hooks (useSocket, useChat, usePresence)
│   │   ├── services/    # REST API and Socket client services
│   │   └── store/       # Reactive state management
└── server/          # Express + Socket.IO backend API
    ├── src/
    │   ├── config/      # Environment and connection configuration
    │   ├── models/      # Mongoose schemas (User, Message, Group, Post)
    │   ├── sockets/     # Dedicated modular Socket.IO event handlers
    │   ├── services/    # Core business logic layer
    │   ├── controllers/ # REST API endpoints controllers
    │   └── routes/      # Versioned API routes
```

---

## 📄 License

MIT License © 2026 Dennis Kiplagat
