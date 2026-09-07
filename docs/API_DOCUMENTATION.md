# REST API Reference Documentation
## LearnMate AI — OpenAPI / REST Endpoints Specification

Base URL: `http://localhost:5000/api/v1` (Production: `https://api.learnmate.ai/api/v1`)

---

## 1. Authentication & User Management

### 1.1 User Registration
- **Endpoint**: `POST /auth/register`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "student@university.edu",
  "password": "SecurePassword123!",
  "fullName": "Salman Tariq",
  "role": "STUDENT"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "student@university.edu",
      "fullName": "Salman Tariq",
      "role": "STUDENT",
      "createdAt": "2026-09-08T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "ref_e4eaaaf2-d14c-4573-8472-8800b46851b9",
      "expiresIn": 900
    }
  }
}
```

### 1.2 User Login
- **Endpoint**: `POST /auth/login`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "student@university.edu",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "student@university.edu",
      "fullName": "Salman Tariq",
      "role": "STUDENT"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "ref_e4eaaaf2-d14c-4573-8472-8800b46851b9"
    }
  }
}
```

### 1.3 Refresh Access Token
- **Endpoint**: `POST /auth/refresh`
- **Request Body**:
```json
{
  "refreshToken": "ref_e4eaaaf2-d14c-4573-8472-8800b46851b9"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_new_8472-8800b46851b9"
  }
}
```

---

## 2. Study Materials & Document Processing

### 2.1 Upload Study Document
- **Endpoint**: `POST /materials/upload`
- **Auth Required**: Yes (Bearer Token)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Binary file (`.pdf`, `.docx`, `.txt`)
  - `title`: String (e.g. `"Database Systems Lecture 4"`)
  - `description`: String (Optional)
- **Response `202 Accepted`**:
```json
{
  "success": true,
  "message": "Material uploaded and scheduled for background vector indexing",
  "data": {
    "id": "mat_f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Database Systems Lecture 4",
    "fileType": "PDF",
    "fileSize": 2457812,
    "status": "PROCESSING",
    "createdAt": "2026-09-08T00:00:00.000Z"
  }
}
```

### 2.2 List User Materials
- **Endpoint**: `GET /materials`
- **Auth Required**: Yes
- **Query Params**: `?page=1&limit=10&status=READY`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "mat_f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Database Systems Lecture 4",
        "fileType": "PDF",
        "pageCount": 48,
        "status": "READY",
        "createdAt": "2026-09-08T00:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10 }
  }
}
```

---

## 3. Hybrid RAG & Multi-Mode AI Tutor

### 3.1 Grounded AI Tutor Explanation
- **Endpoint**: `POST /tutor/explain`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "topic": "Database Normalization",
  "mode": "EXAM",
  "materialId": "mat_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "specificQuestion": "What is 3NF vs BCNF and how to identify violations?"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "topic": "Database Normalization",
    "mode": "EXAM",
    "explanation": "### 3NF vs BCNF Exam Summary\n\n- **3NF Rule**: For every FD $X \\to Y$, $X$ must be a superkey OR $Y$ must be a prime attribute.\n- **BCNF Rule**: For every FD $X \\to Y$, $X$ MUST be a superkey (no exceptions).\n\n**Mnemonic**: *'The key, the whole key, and nothing but the key (so help me Codd)'*.",
    "keyPoints": [
      "BCNF eliminates all transitive dependencies even for prime attributes",
      "All BCNF schemas are 3NF, but not all 3NF schemas are BCNF"
    ],
    "citations": [
      {
        "materialId": "mat_f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "materialTitle": "Database Systems Lecture 4",
        "pageNumber": 32,
        "snippet": "Definition: A relation R is in BCNF if for every non-trivial functional dependency X -> A, X is a superkey of R."
      }
    ]
  }
}
```

### 3.2 Interactive Tutor Chat
- **Endpoint**: `POST /tutor/chat`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "conversationId": "conv_1234",
  "message": "Can you give me a simple real-world analogy for Two-Phase Locking?",
  "mode": "ANALOGY"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "messageId": "msg_5678",
    "sender": "ASSISTANT",
    "content": "Imagine a conference room reservation system. In Phase 1 (Growing), you book all the microphones, projectors, and whiteboards you need. In Phase 2 (Shrinking), once you finish using and release the projector, you are forbidden from booking any new equipment until your entire meeting concludes.",
    "citations": [
      {
        "materialTitle": "Database Systems Lecture 4",
        "pageNumber": 45,
        "snippet": "In 2PL, once a transaction releases a lock, it cannot acquire any new locks."
      }
    ]
  }
}
```

---

## 4. LangGraph Agentic Orchestrator & Action Tools

### 4.1 Execute Agent Loop
- **Endpoint**: `POST /agent/run`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "prompt": "Schedule a 3-day study plan for Operating Systems and create 5 flashcards for Virtual Memory",
  "conversationId": "conv_1234"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "intent": "MULTI_GOAL",
    "toolsExecuted": [
      { "tool": "generate_study_plan", "status": "SUCCESS" },
      { "tool": "generate_flashcards", "status": "SUCCESS" }
    ],
    "response": "I have created your 3-day Operating Systems study plan and generated 5 Virtual Memory flashcards in your deck!",
    "citations": []
  }
}
```

---

## 5. AI Quizzes & Auto-Scoring Engine

### 5.1 Generate AI Practice Quiz
- **Endpoint**: `POST /quizzes/generate`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "topic": "SQL Indexing and Query Optimization",
  "materialId": "mat_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "questionCount": 5,
  "difficulty": "MEDIUM"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "quiz_8912",
    "title": "SQL Indexing & Query Optimization Practice",
    "topic": "SQL Indexing and Query Optimization",
    "difficulty": "MEDIUM",
    "totalQuestions": 5,
    "questions": [
      {
        "id": "q_1",
        "questionOrder": 1,
        "questionText": "Which data structure is most commonly utilized for database index trees?",
        "questionType": "MCQ",
        "options": ["B+ Tree", "Binary Search Tree", "Linked List", "Hash Map"],
        "citationPage": 18
      }
    ]
  }
}
```

### 5.2 Submit Quiz Answers for Auto-Grading
- **Endpoint**: `POST /quizzes/:id/submit`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "timeSpentSeconds": 140,
  "answers": [
    { "questionId": "q_1", "selectedAnswer": "B+ Tree" }
  ]
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "attemptId": "att_4567",
    "score": 5.0,
    "maxScore": 5.0,
    "percentage": 100.0,
    "timeSpentSeconds": 140,
    "feedback": "Outstanding performance! You have demonstrated strong mastery of SQL indexing.",
    "answers": [
      {
        "questionId": "q_1",
        "isCorrect": true,
        "scoreEarned": 1.0,
        "correctAnswer": "B+ Tree",
        "explanation": "B+ Trees provide balanced depth and high fanout, minimizing disk I/O operations."
      }
    ]
  }
}
```

---

## 6. 3D Spaced Repetition Flashcards (SuperMemo SM-2)

### 6.1 Get Due Flashcards
- **Endpoint**: `GET /flashcards/due`
- **Auth Required**: Yes
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalDue": 12,
    "cards": [
      {
        "id": "fc_7890",
        "deckId": "deck_1234",
        "deckTitle": "Operating Systems",
        "frontQuestion": "What is the primary distinction between a Process and a Thread?",
        "backAnswer": "A process has its own dedicated address space and memory; threads within the same process share the heap and address space but have independent stacks.",
        "hint": "Address space sharing",
        "citationPage": 14,
        "repetitions": 2,
        "easeFactor": 2.5,
        "intervalDays": 6
      }
    ]
  }
}
```

### 6.2 Record SM-2 Review Rating
- **Endpoint**: `POST /flashcards/:id/review`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "rating": 4,
  "reviewTimeSeconds": 8
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "flashcardId": "fc_7890",
    "repetitions": 3,
    "easeFactor": 2.5,
    "intervalDays": 15,
    "nextReviewDate": "2026-09-23T00:00:00.000Z"
  }
}
```

---

## 7. Adaptive Study Planner & Rescheduler

### 7.1 Reschedule Study Plan via AI
- **Endpoint**: `POST /study-plans/:id/reschedule`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "instruction": "I have a sudden emergency today. Move today's session to Saturday and shift all remaining sessions forward by 1 day."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Study plan rescheduled successfully",
  "data": {
    "planId": "plan_3456",
    "updatedSessionsCount": 4,
    "nextUpcomingSession": {
      "topic": "Transactions & Concurrency",
      "scheduledDate": "2026-09-12T10:00:00.000Z",
      "durationMinutes": 90
    }
  }
}
```

---

## 8. Voice AI Tutor (Whisper STT & Multi-Voice TTS)

### 8.1 Voice-to-Voice AI Chat
- **Endpoint**: `POST /voice/chat`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `audio`: Binary audio file (`.m4a`, `.wav`, `.mp3`)
  - `voice`: String (Options: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer` — Default: `alloy`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "transcript": "Explain normalization in DBMS and how it prevents data anomalies.",
    "response": "Database normalization organizes tables to reduce redundancy and prevent insertion, update, and deletion anomalies.",
    "citations": [
      {
        "materialTitle": "Database Systems Lecture 4",
        "pageNumber": 22,
        "snippet": "Normalization decomposes relations with anomalies to produce smaller, well-structured relations."
      }
    ],
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA..."
  }
}
```

---
