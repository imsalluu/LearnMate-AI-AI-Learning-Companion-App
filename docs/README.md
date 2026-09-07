# LearnMate AI — Master Documentation Hub

Welcome to the comprehensive technical documentation for **LearnMate AI**, a production-grade AI-powered personalized learning companion mobile application and backend system.

---

## 📚 Documentation Index

| Document | Description | Key Topics |
| :--- | :--- | :--- |
| [**PRD (Product Requirements Document)**](./PRD.md) | Full product specifications, personas, value propositions, and KPIs | Functional & Non-Functional Requirements, User Stories, Success Metrics |
| [**System Architecture**](./SYSTEM_ARCHITECTURE.md) | High-level and module-level architecture diagrams | C4 Architecture, Hybrid RAG, LangGraph Agent Loop, Clean Backend Architecture |
| [**Database Architecture & ERD**](./DATABASE_AND_ERD.md) | Complete database documentation and entity diagrams | Mermaid ERD, 20 Tables Schema, HNSW Vector Indexing, pgvector specs |
| [**System Workflows & Sequences**](./WORKFLOWS.md) | Step-by-step visual sequence and state diagrams | Document Ingestion, Hybrid RAG RRF, Agent Tool Calling, SM-2 Flashcards, Voice AI |
| [**REST API Reference**](./API_DOCUMENTATION.md) | OpenAPI-grade endpoint specifications | Auth, Materials, Tutor, Quizzes, Flashcards, Study Plans, Voice, JSON Schemas |
| [**Mobile Client Architecture**](./MOBILE_ARCHITECTURE.md) | Flutter mobile application architecture & design tokens | Riverpod State Management, GoRouter Sitemap, 3D Matrix4 Flip Cards, Offline Sync |
| [**Deployment & Security Guide**](./DEPLOYMENT_AND_SECURITY.md) | Production DevOps, containerization & security | Docker Compose, Environment Variables, Helmet, Rate Limiter, RBAC, Multi-Tenant RAG |

---

## 🚀 Quick Navigation

```
docs/
├── README.md                     # Master Documentation Index (You are here)
├── PRD.md                        # Product Requirements & Feature Specifications
├── SYSTEM_ARCHITECTURE.md        # Multi-Layer System Architecture & C4 Diagrams
├── DATABASE_AND_ERD.md           # PostgreSQL Schema, ERD & pgvector Config
├── WORKFLOWS.md                  # 10 End-to-End Sequence & State Workflows
├── API_DOCUMENTATION.md          # Complete REST API Endpoints Reference
├── MOBILE_ARCHITECTURE.md        # Flutter Mobile Architecture & UI/UX System
└── DEPLOYMENT_AND_SECURITY.md    # Docker, Security, RBAC & Deployment Guide
```

---

## 🛠️ Tech Stack Matrix

```
+-------------------+-------------------------------------------------------------------+
| Mobile Frontend   | Flutter 3.x, Dart 3.x, Riverpod 2.x, GoRouter 14.x, Dio 5.x       |
+-------------------+-------------------------------------------------------------------+
| Backend Gateway   | Node.js 20+, TypeScript 5.x, Express 4.x, Zod, Helmet, Multer    |
+-------------------+-------------------------------------------------------------------+
| AI & Retrieval    | LangGraph / LangChain, OpenAI (GPT-4o, Whisper, TTS, Embeddings)  |
|                   | Anthropic Claude 3.5 Sonnet, Google Gemini 1.5 Pro, Hybrid RAG    |
+-------------------+-------------------------------------------------------------------+
| Database & Cache  | PostgreSQL 16 + pgvector, Prisma ORM, Redis 7 (In-Memory Cache)  |
+-------------------+-------------------------------------------------------------------+
| Algorithms        | SuperMemo SM-2 Spaced Repetition, Reciprocal Rank Fusion (RRF)    |
+-------------------+-------------------------------------------------------------------+
| DevOps & Tools    | Docker, Docker Compose, Vitest, Git (Conventional Commits)        |
+-------------------+-------------------------------------------------------------------+
```
