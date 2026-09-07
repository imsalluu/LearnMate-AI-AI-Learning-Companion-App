# System Architecture Document
## LearnMate AI — Enterprise Multi-Layer Architecture

---

## 1. High-Level Architecture Diagram (C4 Container View)

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Cross-Platform Mobile)"]
        FlutterApp["Flutter Mobile App (iOS / Android)<br/>- Riverpod State Management<br/>- GoRouter Navigation<br/>- 3D Matrix4 Flip Animations<br/>- Offline SQLite / SharedPrefs Sync<br/>- Whisper STT & Audio Player"]
    end

    subgraph APIGateway ["API Gateway & Security Layer"]
        Nginx["Reverse Proxy / Nginx Gateway"]
        SecurityMW["Security Middleware<br/>- Helmet (HTTP Headers)<br/>- CORS Policy<br/>- Rate Limiting (express-rate-limit + Redis)<br/>- Request Sanitization & Zod Validation"]
        AuthMW["Authentication Middleware<br/>- JWT Bearer Verification<br/>- RBAC (STUDENT / TUTOR / ADMIN)"]
    end

    subgraph AppServer ["Core Application Server (Node.js + TypeScript + Express)"]
        subgraph CoreModules ["Domain Feature Modules"]
            AuthModule["Auth & User Module"]
            MaterialsModule["Document Ingestion & Text Parsing"]
            TutorModule["Multi-Mode AI Tutor & Citations"]
            QuizModule["Quiz Generation & Auto-Scoring"]
            FlashcardModule["SM-2 Flashcards & Decks"]
            PlanModule["Adaptive Study Planner & Calendar"]
            ProgressModule["Topic Mastery & AI Insights"]
            VoiceModule["Voice STT & TTS Service"]
        end

        subgraph AIEngine ["Agentic AI & Retrieval Subsystem"]
            LangGraphAgent["LangGraph Agentic Orchestrator<br/>- Intent Classifier<br/>- Multi-Step Reasoning Loop<br/>- State Persistence"]
            ToolRegistry["13 Action Tools Registry<br/>- Strict JSON Schemas<br/>- Database Mutators & Read Handlers"]
            HybridRAG["Hybrid RAG Pipeline<br/>- Dense Vector Similarity (pgvector)<br/>- Sparse Lexical BM25 Scoring<br/>- Reciprocal Rank Fusion (RRF)<br/>- Source Citation Grounding Engine"]
            UnifiedAIProvider["Unified AI Provider Interface<br/>- OpenAI (GPT-4o / Whisper / TTS)<br/>- Anthropic Claude 3.5 Sonnet<br/>- Google Gemini 1.5 Pro<br/>- Fallback Mock Provider"]
        end
    end

    subgraph DataStorage ["Persistent Data & Cache Layer"]
        PostgresDB[("PostgreSQL 16 Database<br/>- 20 Relational Models<br/>- pgvector Extension (HNSW Indexes)<br/>- ACID Transactions via Prisma ORM")]
        RedisCache[("Redis 7 In-Memory Cache<br/>- Token Blacklisting<br/>- Session Cache & Rate Limit Counters")]
        BlobStorage[("Encrypted File Storage<br/>- Uploaded PDFs, Notes & Audio Files")]
    end

    FlutterApp -->|HTTPS / REST API| Nginx
    Nginx --> SecurityMW
    SecurityMW --> AuthMW
    AuthMW --> CoreModules

    CoreModules --> LangGraphAgent
    LangGraphAgent --> ToolRegistry
    LangGraphAgent --> HybridRAG
    HybridRAG --> UnifiedAIProvider
    HybridRAG --> PostgresDB
    ToolRegistry --> PostgresDB
    ToolRegistry --> RedisCache
    MaterialsModule --> BlobStorage
    MaterialsModule --> HybridRAG
    VoiceModule --> UnifiedAIProvider
    AuthModule --> RedisCache
    AuthModule --> PostgresDB
```

---

## 2. Backend Layered Architecture

The Node.js/TypeScript backend adheres to the **Clean Modular Architecture** pattern, ensuring strict separation of concerns, testability, and maintainability:

```
backend/src/
├── app.ts                 # Express application bootstrap & middleware registration
├── server.ts              # HTTP server listener & graceful shutdown handlers
├── config/                # Environment variables, constants & config loaders
├── common/                # Shared utilities, custom errors, loggers, response helpers
│   ├── errors/            # AppError, UnauthorizedError, NotFoundError, ConflictError
│   ├── middlewares/       # errorHandler, authMiddleware, rateLimiter, requestValidator
│   └── logger/            # Structured JSON logger with timestamps & log levels
├── database/              # Prisma client singleton, connection pooling & test fallbacks
├── modules/               # Domain-specific feature packages
│   ├── auth/              # JWT issuance, refresh rotation, password hashing
│   ├── users/             # User profile management & preferences
│   ├── materials/         # Document upload, PDF parsing, text chunking
│   ├── rag/               # Hybrid dense/sparse vector search & RRF ranking
│   ├── ai/                # Unified AI provider interface (OpenAI, Claude, Gemini)
│   ├── agents/            # LangGraph state machine & multi-turn reasoning graph
│   ├── tools/             # 13 validated database action tools
│   ├── tutor/             # 5 pedagogical explanation modes & citations
│   ├── quizzes/           # AI quiz generation, submission evaluation & grading
│   ├── flashcards/        # SuperMemo SM-2 spaced repetition engine
│   ├── study-plans/       # Adaptive scheduling & conversational rescheduling
│   ├── progress/          # Topic mastery scoring, streaks & AI insights
│   └── voice/             # OpenAI Whisper STT & speech synthesis (TTS)
└── tests/                 # 16 Vitest unit & integration test suites
```

---

## 3. Hybrid RAG (Retrieval-Augmented Generation) Pipeline

```mermaid
flowchart TD
    subgraph IngestionFlow ["1. Document Ingestion & Chunking"]
        RawDoc["Student Material (PDF / DOCX / TXT)"]
        Parser["Text Parser & Formatter"]
        Chunker["Sliding Window Token Chunker<br/>(Size: 500 tokens, Overlap: 100)"]
        Embedder["Dense Embedding Model<br/>(text-embedding-3-small, 1536 dim)"]
        LexicalIndexer["Lexical Token Extractor (BM25)"]
        DBStore[("PostgreSQL 16 + pgvector<br/>HNSW Vector Index")]

        RawDoc --> Parser --> Chunker
        Chunker --> Embedder --> DBStore
        Chunker --> LexicalIndexer --> DBStore
    end

    subgraph QueryFlow ["2. Hybrid Retrieval & RRF Re-Ranking"]
        UserQuery["User Question / Study Prompt"]
        QueryEmbedding["Generate Query Vector Embedding"]
        DenseSearch["pgvector Cosine Distance Search<br/>1 - (embedding <=> query_vec)"]
        SparseSearch["BM25 Lexical Keyword Search<br/>tsvector @@ plainto_tsquery"]
        RRF["Reciprocal Rank Fusion (RRF)<br/>RRF(d) = Σ 1 / (60 + rank(d))"]
        ContextAssembler["Top-K Grounded Context Assembly<br/>+ Page & Snippet Citations"]

        UserQuery --> QueryEmbedding --> DenseSearch
        UserQuery --> SparseSearch
        DenseSearch --> RRF
        SparseSearch --> RRF
        RRF --> ContextAssembler
    end

    subgraph SynthesisFlow ["3. LLM Response Generation"]
        ContextAssembler --> LLM["LLM (GPT-4o / Claude 3.5 / Gemini 1.5)"]
        LLM --> GroundedResponse["Grounded Response with Page Citations<br/>[Material: 'CS101.pdf', Page: 42, Confidence: 96%]"]
    end
```

### RRF Mathematical Formulation
For each retrieved document chunk $d \in D$:
$$RRF(d) = \frac{1}{k + rank_{dense}(d)} + \frac{1}{k + rank_{sparse}(d)}$$
*Where $k = 60$ is the standard smoothing constant preventing low-rank dominance.*

---

## 4. LangGraph Agent State Machine & Tool Execution Loop

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> IntentClassification: User sends prompt / question
    
    state IntentClassification {
        [*] --> ClassifyIntent
        ClassifyIntent --> EXPLANATION_QA: Study query / concept clarification
        ClassifyIntent --> QUIZ_REQUEST: "Create a quiz on topic X"
        ClassifyIntent --> FLASHCARD_REQUEST: "Make flashcards for Chapter 3"
        ClassifyIntent --> STUDY_PLAN_RESCHEDULE: "Reschedule my study sessions"
        ClassifyIntent --> MASTERY_QUERY: "How well do I know Normalization?"
        ClassifyIntent --> GENERAL_CHAT: Greeting / conversational query
    }

    IntentClassification --> ToolSelection: Intent identified
    
    state ToolSelection {
        [*] --> SelectTools
        SelectTools --> SearchMaterials: Needs grounded course knowledge
        SelectTools --> ReschedulePlan: Needs study plan modification
        SelectTools --> GenerateQuiz: Needs practice quiz generation
        SelectTools --> GenerateFlashcards: Needs flashcard deck creation
        SelectTools --> GetMasteryAnalytics: Needs analytics report
    }

    ToolSelection --> ToolExecution: Execute validated action tool
    
    state ToolExecution {
        [*] --> ValidateParams
        ValidateParams --> RunDatabaseAction: Schema valid
        RunDatabaseAction --> SynthesizeResult: DB operation completed
    }

    ToolExecution --> DecisionNode: Check if more tools needed

    state DecisionNode <<choice>>
    DecisionNode --> ToolSelection: Needs another tool (Iterations < 5)
    DecisionNode --> SynthesizeFinalAnswer: Complete context gathered

    SynthesizeFinalAnswer --> GroundedOutput: Format with markdown, code & citations
    GroundedOutput --> Idle: Deliver to mobile client via REST / Stream
```

---

## 5. Security & Authentication Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Flutter App)
    participant Gateway as API Gateway & Security
    participant Auth as Auth Module
    participant DB as PostgreSQL
    participant Redis as Redis Cache

    Note over Student, Gateway: 1. User Login & Token Issuance
    Student->>Gateway: POST /api/v1/auth/login {email, password}
    Gateway->>Auth: Validate Credentials (bcrypt.compare)
    Auth->>DB: Query User & Role
    Auth->>Auth: Issue Access Token (JWT, 15m) & Refresh Token (UUID, 7d)
    Auth->>DB: Persist RefreshToken record
    Auth-->>Student: 200 OK {accessToken, refreshToken, user}

    Note over Student, Gateway: 2. Authenticated Request
    Student->>Gateway: GET /api/v1/tutor/explain (Header: Bearer <AccessToken>)
    Gateway->>Gateway: Verify JWT Signature & Expiration
    Gateway->>Gateway: Check Rate Limits in Redis
    Gateway->>Auth: Attach req.user = {id, email, role}
    Gateway-->>Student: 200 OK Grounded Response

    Note over Student, Gateway: 3. Token Refresh Rotation
    Student->>Gateway: POST /api/v1/auth/refresh {refreshToken}
    Gateway->>Auth: Check if refreshToken is valid & not revoked
    Auth->>DB: Revoke old refreshToken
    Auth->>DB: Issue & store new refreshToken
    Auth-->>Student: 200 OK {accessToken: <new_jwt>, refreshToken: <new_token>}
```

---

## 6. Mobile Architecture & Design System

The mobile client is engineered using **Flutter 3.x + Dart 3.x** following the **Feature-First Architecture** with **Riverpod 2.x** and **GoRouter 14.x**:

```
mobile/lib/
├── main.dart                      # App entry point & ProviderScope initialization
├── core/
│   ├── network/                   # Dio HTTP client, JWT interceptor, refresh queue
│   ├── router/                    # GoRouter configuration with 15 authenticated routes
│   ├── theme/                     # Glassmorphic Dark & Light theme design tokens
│   ├── offline/                   # SQLite local cache & offline mutation sync manager
│   ├── audio/                     # Audio recorder & player controller for Voice AI
│   └── utils/                     # Formatters, date helpers, markdown renderers
└── features/                      # Domain feature modules (UI + Riverpod Providers)
    ├── auth/                      # Login, Registration, Splash & Token Provider
    ├── home/                      # Home Dashboard, Streaks & Quick Actions
    ├── materials/                 # Document Uploader, Chunk Progress & PDF Viewer
    ├── tutor/                     # Grounded AI Tutor Chat & Citation Sheet
    ├── voice/                     # Voice Tutor Modal & Soundwave Visualizer
    ├── quiz/                      # Interactive Quiz Runner, Timers & Score Cards
    ├── flashcards/                # 3D Matrix4 Flip Cards & SM-2 Rating Controls
    ├── study_plan/                # Study Timeline Calendar & Reschedule Modal
    └── progress/                  # Mastery Heatmaps, AI Insights & Profile Settings
```

---
