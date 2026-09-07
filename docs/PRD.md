# Product Requirements Document (PRD)
## LearnMate AI — Next-Gen AI Learning Companion

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**LearnMate AI** is a production-grade, AI-powered personalized learning companion designed to empower students and lifelong learners to master any subject using their **own study materials** (PDFs, lecture slides, textbooks, research papers, and notes). 

Rather than acting as a generic chatbot wrapper, LearnMate AI combines **Hybrid RAG (Retrieval-Augmented Generation)**, **LangGraph Agentic Workflows**, **Spaced Repetition (SuperMemo SM-2)**, **Dynamic Study Planning**, and **Voice STT/TTS** to deliver a deeply personalized, factually grounded, and interactive learning experience.

### 1.2 Problem Statement
- **Information Overload**: Students struggle to digest hundreds of pages of complex lecture slides and textbooks.
- **Hallucination in Generic AI**: Standard LLMs often hallucinate facts or fail to ground answers in university-specific course syllabi and teacher slides.
- **Passive Studying vs. Active Recall**: Most learners passively read materials rather than testing themselves with spaced repetition flashcards or targeted practice quizzes.
- **Rigid Schedules**: Traditional study planners fail when life happens—students need adaptive study plans that dynamically reschedule missed sessions through conversational commands.
- **Lack of Multimodal Support**: Students on the go cannot easily interact with their study materials hands-free via voice.

### 1.3 Target Audience & User Personas
1. **University / College Students**:
   - Needs: Upload 100+ page textbook chapters and lecture slides, ask specific exam-focused questions, generate practice quizzes before midterms.
2. **Professional Certification Aspirants (AWS, CFA, USMLE, PMP)**:
   - Needs: Spaced repetition flashcards with SM-2 mastery tracking, high-yield concept extraction, topic weakness analysis.
3. **Lifelong Self-Learners**:
   - Needs: Conversational voice tutor with multiple explanation styles (ELI5, Socratic, Analogy) for complex technical papers.

---

## 2. Core Value Propositions

```
+-----------------------------------------------------------------------------------------+
|                                    LEARNMATE AI                                         |
+------------------------------------+----------------------------------------------------+
| 📚 Grounded Source Citations       | 🤖 LangGraph Multi-Tool Agent                      |
| Zero hallucination, page-level refs| Intent detection, 13 autonomous DB tools           |
+------------------------------------+----------------------------------------------------+
| 🧠 SuperMemo SM-2 Spaced Repetition| 📅 Adaptive Study Planner                          |
| Optimal memory retention intervals | Conversational rescheduling in natural language    |
+------------------------------------+----------------------------------------------------+
| 🎙️ Voice-First Interaction         | 📶 Offline-First Mobile Experience                 |
| Whisper STT + Multi-Voice TTS      | Full offline caching for cards, quizzes & plans    |
+------------------------------------+----------------------------------------------------+
```

---

## 3. Detailed Functional Requirements

### 3.1 Document Ingestion & Multimodal Processing
- **FR-DOC-01**: System must support uploading documents in `PDF`, `DOCX`, `TXT`, and `Markdown` formats up to 50MB.
- **FR-DOC-02**: System must automatically parse text, extract metadata (title, author, total pages), and strip noisy formatting.
- **FR-DOC-03**: System must implement intelligent token-aware chunking (default chunk size: 500 tokens, 100 token overlap) preserving paragraph and section boundaries.
- **FR-DOC-04**: System must compute dense vector embeddings (e.g. OpenAI `text-embedding-3-small` / 1536 dimensions) and persist them into PostgreSQL with `pgvector` HNSW indexes.
- **FR-DOC-05**: System must extract and index lexical tokens for BM25 hybrid keyword retrieval.

### 3.2 Hybrid RAG & Multi-Mode AI Tutor
- **FR-RAG-01**: Retrieval engine must execute **Hybrid Search**: Dense vector cosine similarity ($K_d$) combined with BM25 keyword matching ($K_s$) fused via **Reciprocal Rank Fusion (RRF)**:
  $$RRF\_Score(d) = \sum_{m \in \{dense, sparse\}} \frac{1}{60 + rank_m(d)}$$
- **FR-RAG-02**: System must enforce page-level source citations on all generated answers, returning `materialId`, `materialTitle`, `pageNumber`, and `snippet`.
- **FR-RAG-03**: Multi-Mode AI Tutor must support 5 distinct pedagogical modes:
  - **Simple (ELI5)**: Clear, jargon-free explanations with everyday examples.
  - **Detailed (Deep-Dive)**: Comprehensive technical breakdown with architectural nuances.
  - **Socratic**: Guides the student to discover answers by asking thought-provoking questions.
  - **Exam-Focused**: High-yield formulas, common pitfalls, and mnemonic memory aids.
  - **Analogy**: Relatable real-world metaphors for abstract concepts.

### 3.3 LangGraph Agentic Orchestrator & Tool Calling
- **FR-AGT-01**: The system must process user prompts through a LangGraph state machine with automatic intent classification:
  - `EXPLANATION_QA`
  - `QUIZ_REQUEST`
  - `FLASHCARD_REQUEST`
  - `STUDY_PLAN_RESCHEDULE`
  - `MASTERY_QUERY`
  - `GENERAL_CHAT`
- **FR-AGT-02**: Agent must have access to **13 validated backend database action tools**:
  1. `search_materials`: Hybrid RAG vector search across user documents.
  2. `get_material_details`: Retrieve document metadata and raw chunk contents.
  3. `get_study_plan`: Retrieve user's current study plan and upcoming sessions.
  4. `reschedule_study_plan`: Shift sessions dynamically via AI instructions.
  5. `generate_quiz`: Generate grounded quizzes with multiple-choice and short answers.
  6. `get_quiz_details`: Retrieve quiz questions and previous attempt scores.
  7. `submit_quiz_answers`: Auto-grade student submissions and update topic mastery.
  8. `generate_flashcards`: Generate Q&A flashcards with key concepts and hints.
  9. `get_due_flashcards`: Fetch flashcards due today based on SM-2 intervals.
  10. `record_flashcard_review`: Record SM-2 rating (0-5) and recalculate next review date.
  11. `get_mastery_analytics`: Fetch mastery levels per topic and weak spots.
  12. `get_learning_insights`: Generate personalized AI study recommendations.
  13. `log_study_activity`: Track study duration, session type, and streak counters.

### 3.4 AI Quiz Generator & Auto-Scoring Engine
- **FR-QZ-01**: Generate customized quizzes based on selected materials with selectable difficulty (`EASY`, `MEDIUM`, `HARD`) and question counts (3 to 25).
- **FR-QZ-02**: Support multiple question types: Multiple Choice (`MCQ`), True/False (`BOOLEAN`), and Short Answer (`OPEN`).
- **FR-QZ-03**: Automatically grade submissions instantly, providing granular explanations for both correct and incorrect options.
- **FR-QZ-04**: Feed quiz score outcomes directly into the **Topic Mastery Engine** to dynamically update user competency scores.

### 3.5 3D Spaced Repetition Flashcards (SuperMemo SM-2)
- **FR-FC-01**: Automatically synthesize flashcards from uploaded documents with concise questions, answers, and context clues.
- **FR-FC-02**: Implement the complete SuperMemo SM-2 mathematical algorithm:
  - **Ease Factor Update**: $EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$, where $EF \ge 1.3$ and $q \in [0, 5]$.
  - **Interval Progression**:
    - If $q < 3$: $Repetitions = 0$, $Interval = 1\text{ day}$
    - If $q \ge 3$: $Interval_1 = 1\text{ day}$, $Interval_2 = 6\text{ days}$, $Interval_n = Interval_{n-1} \times EF'$
- **FR-FC-03**: Mobile UI must render cards with realistic 3D perspective flip animations (`Matrix4` rotation) and 4-tier rating triggers (`Again [1]`, `Hard [2]`, `Good [4]`, `Easy [5]`).

### 3.6 Adaptive Study Planner & Conversational Rescheduler
- **FR-PLN-01**: Generate structured multi-week study roadmaps based on target exam dates, available daily study hours, and syllabus complexity.
- **FR-PLN-02**: Distribute topics logically from foundational concepts to advanced applications.
- **FR-PLN-03**: Support conversational rescheduling (e.g. *"I am sick today, shift today's 2-hour session to Saturday and balance the rest"*).

### 3.7 Voice AI Tutor (Whisper STT & Multi-Voice TTS)
- **FR-VOX-01**: Provide a hands-free voice interface supporting audio input recording in `.m4a` / `.wav` / `.mp3`.
- **FR-VOX-02**: Transcribe audio speech to text using OpenAI Whisper with high accuracy across technical vocabulary.
- **FR-VOX-03**: Synthesize grounded AI responses into natural speech with multiple voice personas (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`).
- **FR-VOX-04**: Mobile UI must include animated sound wave visualizers and playback controls.

### 3.8 Offline-First Mobile Experience & Sync
- **FR-OFF-01**: Cache downloaded flashcards, active study plans, and recent conversation history locally in SQLite / SharedPreferences.
- **FR-OFF-02**: Allow offline flashcard reviews and study session completions without an active internet connection.
- **FR-OFF-03**: Automatically queue offline mutations and synchronize with the backend upon network reconnection using conflict-free timestamp ordering.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Latency
- **NFR-PERF-01**: Hybrid RAG vector retrieval latency must remain below **150ms** for up to 100,000 vector chunks.
- **NFR-PERF-02**: AI streaming time-to-first-token (TTFT) must be under **800ms**.
- **NFR-PERF-03**: Mobile app UI must maintain a consistent **60fps / 120fps** frame rate during 3D flip card animations and list scrolls.

### 4.2 Security & Compliance
- **NFR-SEC-01**: Authentication using industry-standard JWT (Access Token: 15m expiration, Refresh Token: 7d sliding expiration).
- **NFR-SEC-02**: Passwords hashed using `bcryptjs` with a work factor of 12.
- **NFR-SEC-03**: Multi-tier rate limiting (100 req/min for general endpoints, 10 req/min for AI generation endpoints).
- **NFR-SEC-04**: Strict tenant data isolation—users can never query or retrieve vector chunks belonging to another user.

### 4.3 Scalability & Reliability
- **NFR-SCL-01**: Stateless Express/Node.js backend containerized via Docker for horizontal auto-scaling.
- **NFR-SCL-02**: PostgreSQL connection pooling with Prisma to handle high concurrent request volumes.
- **NFR-SCL-03**: Redis caching for frequently accessed study plans and rate limit tracking.

---

## 5. Success Metrics & KPIs

| Metric | Target Goal | Measurement Method |
| :--- | :--- | :--- |
| **Citation Grounding Accuracy** | $\ge 98\%$ factual adherence | Automated citation verification & user feedback flag rate |
| **Study Session Completion Rate** | $\ge 75\%$ adherence to plan | Completed sessions vs. scheduled sessions |
| **Knowledge Retention Rate** | $\ge 85\%$ flashcard recall | SM-2 retention score on $>21$ day intervals |
| **Voice Query Latency** | $< 2.5\text{s}$ total roundtrip | Audio upload to TTS speech playback start |
| **Mobile Crash-Free Users** | $\ge 99.8\%$ | Sentry / Firebase Crashlytics telemetry |

---
