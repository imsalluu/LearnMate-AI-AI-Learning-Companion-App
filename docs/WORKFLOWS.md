# System Workflows & Sequence Diagrams
## LearnMate AI — End-to-End Operational Workflows

---

## 1. Document Ingestion & Vector Indexing Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Flutter App)
    participant Gateway as API Gateway (Multer)
    participant MaterialService as Material Processing Service
    participant TextParser as PDF / DOCX Parser
    participant Chunker as Sliding Window Chunker
    participant AIEmbedder as OpenAI Embeddings (1536d)
    participant Postgres as PostgreSQL (pgvector)

    Student->>Gateway: POST /api/v1/materials/upload (multipart/form-data: File.pdf)
    Gateway->>MaterialService: Validate File Type & Size (<50MB)
    MaterialService->>Postgres: INSERT INTO study_materials (status: 'PROCESSING')
    MaterialService-->>Student: 202 Accepted {materialId, status: 'PROCESSING'}

    par Background Parsing & Vectorization
        MaterialService->>TextParser: Parse Raw Binary to Clean Text
        TextParser-->>MaterialService: Extracted Text & Page Boundaries (e.g. 85 pages)
        MaterialService->>Chunker: Split Text (size: 500 tokens, overlap: 100)
        Chunker-->>MaterialService: Chunks Array [Chunk 1..N]
        
        loop Batch Embedding (16 chunks per batch)
            MaterialService->>AIEmbedder: POST /v1/embeddings {input: chunkTexts}
            AIEmbedder-->>MaterialService: Dense Vector Array (1536 float values)
        end

        MaterialService->>Postgres: Bulk INSERT INTO material_chunks (materialId, chunkIndex, content, pageNumber, embedding)
        MaterialService->>Postgres: UPDATE study_materials SET status = 'READY', pageCount = 85
    end
```

---

## 2. Hybrid RAG Retrieval & Reciprocal Rank Fusion (RRF) Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant TutorEngine as AI Tutor Service
    participant Embedder as Embedding Service
    participant VectorDB as pgvector (HNSW Index)
    participant LexicalDB as PostgreSQL Full-Text (tsvector)
    participant RRFEngine as RRF & Re-Ranking Engine
    participant LLM as OpenAI GPT-4o / Claude 3.5

    Student->>TutorEngine: "Explain Two-Phase Locking with an example"
    
    par Parallel Retrieval
        TutorEngine->>Embedder: Generate Query Embedding (vector)
        Embedder-->>VectorDB: SELECT * FROM material_chunks ORDER BY embedding <=> query_vec LIMIT 10
        VectorDB-->>RRFEngine: Dense Ranked Results (Top 10)
        
        TutorEngine->>LexicalDB: SELECT * FROM material_chunks WHERE to_tsvector(content) @@ plainto_tsquery('Two-Phase Locking') LIMIT 10
        LexicalDB-->>RRFEngine: Sparse BM25 Ranked Results (Top 10)
    end

    RRFEngine->>RRFEngine: Calculate RRF Scores: Score(d) = Σ 1/(60 + rank(d))
    RRFEngine->>RRFEngine: Re-rank & Deduplicate (Select Top 4 most grounded chunks)
    RRFEngine-->>TutorEngine: Top-4 Chunks with Page Citations (e.g., Slides p. 45-47)

    TutorEngine->>LLM: System Prompt [Mode: EXAM] + Context Chunks + User Query
    LLM-->>TutorEngine: Grounded Answer + Explicit Page References
    TutorEngine-->>Student: Grounded Explanation + Citation Bottom-Sheet Metadata
```

---

## 3. LangGraph Agentic Orchestrator & Tool Calling Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant Agent as LangGraph Orchestrator
    participant Intent as Intent Classifier Node
    participant ToolNode as Tool Execution Node
    participant ToolReg as Tool Registry (13 Tools)
    participant DB as PostgreSQL DB
    participant Responder as Answer Synthesis Node

    Student->>Agent: "Create a 5-question quiz for my DBMS Midterm and show my current mastery"
    Agent->>Intent: Classify User Intent
    Intent-->>Agent: Primary Intent: MULTI_GOAL (QUIZ_REQUEST + MASTERY_QUERY)

    rect rgb(240, 248, 255)
        Note over Agent, ToolReg: Iteration 1: Generate Practice Quiz
        Agent->>ToolNode: Call generate_quiz(topic: 'DBMS', count: 5, difficulty: 'MEDIUM')
        ToolNode->>ToolReg: Execute generate_quiz
        ToolReg->>DB: Fetch relevant chunks & create Quiz + Questions
        DB-->>ToolNode: Quiz Created (ID: qz_789, 5 Questions)
        ToolNode-->>Agent: Tool Result 1: {quizId: "qz_789", title: "DBMS Midterm Practice"}
    end

    rect rgb(255, 245, 238)
        Note over Agent, ToolReg: Iteration 2: Retrieve Mastery Analytics
        Agent->>ToolNode: Call get_mastery_analytics(topic: 'DBMS')
        ToolNode->>ToolReg: Execute get_mastery_analytics
        ToolReg->>DB: Query TopicMastery for topic 'DBMS'
        DB-->>ToolNode: Mastery: 68.5% (Weakness: B-Tree Indexing)
        ToolNode-->>Agent: Tool Result 2: {masteryScore: 68.5, weakAreas: ['B-Tree Indexing']}
    end

    Agent->>Responder: Synthesize Unified Final Response
    Responder-->>Student: "I've generated your 5-question DBMS practice quiz! Your current mastery is 68.5% (focus on B-Tree Indexing). Ready to start?"
```

---

## 4. SuperMemo SM-2 Spaced Repetition Review Loop

```mermaid
flowchart TD
    Start([User opens Flashcard Deck]) --> FetchDue[Fetch Due Cards: nextReviewDate <= NOW]
    FetchDue --> DisplayCard[Display Front Question & Hint]
    DisplayCard --> UserFlip[User taps card to 3D Flip]
    UserFlip --> RevealAnswer[Reveal Back Answer & Source Citation]
    RevealAnswer --> RatePerformance[User rates recall quality q: 0 to 5]

    RatePerformance --> CalcSM2{Is q >= 3? Success}

    CalcSM2 -- Yes (Recall Succeeded) --> IncRep[Repetitions = Repetitions + 1]
    IncRep --> CheckRep{Repetitions == 1?}
    CheckRep -- Yes --> SetInt1[Interval = 1 Day]
    CheckRep -- No --> CheckRep2{Repetitions == 2?}
    CheckRep2 -- Yes --> SetInt2[Interval = 6 Days]
    CheckRep2 -- No --> SetIntN["Interval = Interval * EaseFactor"]

    CalcSM2 -- No (Failed Recall) --> ResetRep[Repetitions = 0<br/>Interval = 1 Day]

    SetInt1 --> UpdateEF["Update Ease Factor:<br/>EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))<br/>EF' = max(1.3, EF')"]
    SetInt2 --> UpdateEF
    SetIntN --> UpdateEF
    ResetRep --> UpdateEF

    UpdateEF --> ScheduleDate["nextReviewDate = NOW + Interval Days"]
    ScheduleDate --> SaveDB[Save FlashcardReview record & update Flashcard in DB]
    SaveDB --> NextCard{More Due Cards?}
    NextCard -- Yes --> DisplayCard
    NextCard -- No --> FinishDeck([Deck Complete! Update Topic Mastery])
```

---

## 5. Voice AI Tutor (STT -> LLM -> TTS) Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Flutter App)
    participant Mic as Audio Recording Engine
    participant VoiceService as Backend Voice Service
    participant Whisper as OpenAI Whisper STT
    participant Agent as LangGraph Learning Agent
    participant TTS as OpenAI TTS Engine
    participant AudioPlayer as Mobile Audio Player

    Student->>Mic: Tap & Hold Mic (Speak question: "What is BCNF?")
    Mic-->>Student: Live Audio Waveform Animation
    Student->>Mic: Release Mic (Stop Recording)
    Mic->>VoiceService: POST /api/v1/voice/chat (multipart audio: voice.m4a)
    
    VoiceService->>Whisper: Transcribe Audio File
    Whisper-->>VoiceService: Transcription: "What is Boyce-Codd Normal Form and when do we use it?"
    
    VoiceService->>Agent: Process Question via LangGraph Agent & RAG
    Agent-->>VoiceService: Grounded Answer: "Boyce-Codd Normal Form (BCNF) is a stricter version of 3NF..."
    
    VoiceService->>TTS: POST /v1/audio/speech {input: answerText, voice: 'alloy'}
    TTS-->>VoiceService: Synthesized Audio Binary (MP3 Stream)
    
    VoiceService-->>Student: 200 OK {transcript, answerText, citations, audioBase64}
    Student->>AudioPlayer: Play Speech Response & Highlight Citation Chips
```

---

## 6. Mobile Offline-First Storage & Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant MobileUI as Flutter UI
    participant LocalDB as Local SQLite / SharedPreferences
    participant SyncMgr as OfflineSyncManager
    participant RemoteAPI as Backend REST API
    participant Postgres as PostgreSQL Database

    Note over Student, LocalDB: 1. Online Prefetch & Cache
    Student->>MobileUI: Open Flashcards & Study Plan
    MobileUI->>RemoteAPI: GET /api/v1/flashcards/due & GET /api/v1/study-plans
    RemoteAPI-->>MobileUI: Fresh Data Payload
    MobileUI->>LocalDB: Store Decks, Cards, and Sessions locally

    Note over Student, LocalDB: 2. Offline Mode Operations (Airplane Mode)
    Student->>MobileUI: Complete 15 Flashcard Reviews & 1 Study Session
    MobileUI->>LocalDB: Save reviews locally & update local card intervals
    MobileUI->>SyncMgr: Append actions to pending_mutations_queue

    Note over Student, RemoteAPI: 3. Network Restored & Automatic Sync
    SyncMgr->>SyncMgr: Detect Internet Connectivity (connectivity_plus)
    SyncMgr->>LocalDB: Read pending_mutations_queue (16 items)
    
    loop Synchronize Mutations Batch
        SyncMgr->>RemoteAPI: POST /api/v1/sync/mutations {mutations: batch}
        RemoteAPI->>Postgres: Process SM-2 reviews & mark sessions complete
        Postgres-->>RemoteAPI: Success Confirmation
        RemoteAPI-->>SyncMgr: 200 OK {syncedCount: 16}
    end

    SyncMgr->>LocalDB: Clear pending_mutations_queue & update sync timestamp
    SyncMgr-->>MobileUI: Broadcast Sync Complete Toast
```

---
