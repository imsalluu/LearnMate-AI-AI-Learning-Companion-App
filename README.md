# LearnMate AI — Production-Grade AI Learning Companion 🚀

[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter)](https://flutter.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis)](https://redis.io)
[![LangGraph](https://img.shields.io/badge/AI-LangGraph%20%2F%20Agentic-FF6F00)](https://langchain.com)

**LearnMate AI** is an intelligent, personalized, production-grade learning companion application designed for modern students. Instead of a generic chatbot wrapper, LearnMate AI combines agentic reasoning (LangGraph), hybrid RAG retrieval (pgvector + full-text search), spaced repetition (SM-2 flashcards), automated quiz generation, personalized dynamic study plans, speech-to-text / text-to-speech voice tutoring, and offline-first mobile synchronization.

---

## 🌟 Key Architecture & Highlights

- **📱 Flutter Mobile App**: Riverpod state management, GoRouter declarative navigation, Dio HTTP networking with token refresh, offline-first caching, interactive 3D flashcards, animated quiz runner, and voice tutor sheet.
- **⚡ High-Performance Backend**: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL + `pgvector`, Redis BullMQ async queue.
- **🧠 Multi-Agent Orchestrator**: LangGraph state machine detecting student intent, invoking 13+ validated backend tools, avoiding hallucinations, and maintaining source citations.
- **📚 Hybrid RAG Pipeline**: Document parsing (PDF, DOCX, TXT, Markdown), recursive semantic chunking, embedding generation, vector cosine similarity + keyword hybrid search with re-ranking.
- **🎙️ Voice AI Tutor**: Speech-to-Text audio transcription and Text-to-Speech synthesis for natural hands-free learning sessions.
- **📊 Topic Mastery & Insights**: Real-time mastery scoring, spaced repetition schedule, learning streak tracker, and proactive study recommendations.

---

## 🏗️ System Architecture

```
                                +---------------------------+
                                |    Flutter Mobile App     |
                                |  (Riverpod + GoRouter)    |
                                +-------------+-------------+
                                              |
                                              | REST / Audio Stream / JWT
                                              v
+-----------------------------------------------------------------------------------------+
|                               Node.js TypeScript Backend                                |
|                                                                                         |
|  +--------------------+   +-----------------------+   +-------------------------------+ |
|  |  Auth & Security   |   |   LangGraph Agent     |   |   Hybrid RAG Engine           | |
|  | (JWT, RBAC, Helmet)|   | (Intent, Routing, ST) |   | (Chunking, pgvector, Rank)    | |
|  +--------------------+   +-----------+-----------+   +---------------+---------------+ |
|                                       |                               |                 |
|                                       v                               v                 |
|  +------------------------------------+-------------------------------+---------------+ |
|  |                           Validated Backend Tool Registry                          | |
|  |   (search_materials, generate_quiz, update_study_plan, record_quiz_result, ...)   | |
|  +------------------------------------+-------------------------------+---------------+ |
|                                       |                               |                 |
+---------------------------------------|-------------------------------|-----------------+
                                        v                               v
                        +---------------+---------------+---------------+---------------+
                        |  PostgreSQL + pgvector DB     |    Redis (BullMQ & Cache)     |
                        +-------------------------------+-------------------------------+
```

---

## 📂 Project Structure

```
.
├── backend/                  # Node.js + TypeScript REST & Agent API
│   ├── src/
│   │   ├── config/           # Environment & system configurations
│   │   ├── database/         # Prisma Client, migrations & seeds
│   │   ├── middlewares/      # Auth, RBAC, Error, Rate limiting
│   │   ├── modules/          # Domain modules (Auth, Materials, RAG, Tutor, Quiz, etc.)
│   │   ├── workers/          # BullMQ background workers for ingestion
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # HTTP server entry point
│   ├── tests/                # Unit & Integration test suite
│   └── package.json
├── mobile/                   # Flutter Mobile Application
│   ├── lib/
│   │   ├── core/             # Themes, Network, Storage, Router, Offline
│   │   ├── features/         # Feature modules (Auth, Dashboard, Tutor, Materials, Quiz, etc.)
│   │   └── main.dart
│   └── pubspec.yaml
├── docker-compose.yml        # Multi-container orchestration (Backend, Postgres, Redis)
├── Dockerfile                # Production multi-stage Docker build
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- Flutter SDK >= 3.x
- Docker & Docker Compose (Optional for containerized run)
- PostgreSQL with `pgvector` extension
- Redis server

### Quick Setup

```bash
# Clone repository
git clone https://github.com/imsalluu/LearnMate-AI-AI-Learning-Companion-App.git
cd LearnMate-AI-AI-Learning-Companion-App

# Backend Setup
cd backend
npm install
cp .env.example .env
npm run build
npm test

# Mobile Setup
cd ../mobile
flutter pub get
flutter test
flutter run
```

---

## 📄 License
This project is licensed under the MIT License.
