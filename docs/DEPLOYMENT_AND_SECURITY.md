# Deployment, Security & DevOps Guide
## LearnMate AI — Production Infrastructure & Security Hardening

---

## 1. Docker Multi-Container Architecture

LearnMate AI is fully containerized using Docker and Docker Compose for production deployments and local multi-service orchestration:

```mermaid
graph TD
    subgraph Host ["Production Host / VPS / Kubernetes Cluster"]
        NginxProxy["Nginx Ingress / SSL Terminator (Port 443 / 80)"]
        
        subgraph DockerCompose ["Docker Compose Network (learnmate-net)"]
            NodeApp["LearnMate Node.js API (Port 5000)<br/>- Express Server<br/>- LangGraph Agent<br/>- Prisma ORM"]
            Postgres["PostgreSQL 16 + pgvector (Port 5432)<br/>- Volume: pgdata<br/>- HNSW Vector Indexes"]
            RedisCache["Redis 7 Alpine (Port 6379)<br/>- Volume: redisdata<br/>- Cache & Token Blacklists"]
        end
    end

    NginxProxy --> NodeApp
    NodeApp --> Postgres
    NodeApp --> RedisCache
```

### 1.1 `docker-compose.yml` Configuration
```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: learnmate_postgres
    restart: always
    environment:
      POSTGRES_USER: learnmate_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_pg_password_2026}
      POSTGRES_DB: learnmate_ai
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U learnmate_admin -d learnmate_ai"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: learnmate_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: learnmate_backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      PORT: 5000
      NODE_ENV: production
      DATABASE_URL: postgresql://learnmate_admin:${DB_PASSWORD:-secure_pg_password_2026}@postgres:5432/learnmate_ai?schema=public
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "5000:5000"

volumes:
  pgdata:
  redisdata:
```

---

## 2. Environment Variables & Secret Configuration

Create a `.env` file in `backend/` based on `backend/.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/learnmate_ai` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | 256-bit secret for signing access tokens | `your_ultra_secure_jwt_access_secret_key` |
| `JWT_REFRESH_SECRET`| 256-bit secret for signing refresh tokens | `your_ultra_secure_jwt_refresh_secret_key` |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `OPENAI_API_KEY` | OpenAI API key for LLM, Whisper & TTS | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | (Optional) Anthropic Claude API key | `sk-ant-...` |
| `GEMINI_API_KEY` | (Optional) Google Gemini API key | `AIzaSy...` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` (1 minute) |
| `RATE_LIMIT_MAX` | Max allowed requests per window | `100` |

---

## 3. Security Hardening & Threat Mitigation

```
+---------------------------------------------------------------------------------------+
|                                SECURITY HARDENING MATRIX                              |
+------------------------------+--------------------------------------------------------+
| 🛡️ Helmet Security Headers    | • Disables X-Powered-By header                         |
|                              | • Enforces Content-Security-Policy (CSP)               |
|                              | • Strict-Transport-Security (HSTS: 1 Year)            |
|                              | • X-Content-Type-Options: nosniff                      |
|                              | • X-Frame-Options: DENY (Clickjacking mitigation)      |
+------------------------------+--------------------------------------------------------+
| 🔐 Two-Tier Rate Limiter     | • Tier 1 (Standard API): 100 requests / minute / IP    |
|                              | • Tier 2 (AI Generation): 10 requests / minute / IP    |
+------------------------------+--------------------------------------------------------+
| 🔒 Multi-Tenant RAG Isolation| • Vector similarity query ALWAYS injects:              |
|                              |   `WHERE m.userId = :authenticatedUserId`              |
|                              | • Zero risk of cross-user knowledge chunk leakage      |
+------------------------------+--------------------------------------------------------+
| 🔑 Cryptographic Auth        | • Passwords hashed via Bcrypt (Cost 12)                |
|                              | • Refresh Token Rotation with immediate invalidation   |
+------------------------------+--------------------------------------------------------+
```

---

## 4. Production Deployment Checklist

1. **Database Migration**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
2. **Launch Services**:
   ```bash
   docker-compose up -d --build
   ```
3. **Verify Service Health**:
   ```bash
   curl -I http://localhost:5000/api/v1/health
   ```
4. **Build Mobile Release Bundle**:
   ```bash
   cd mobile
   flutter build apk --release
   flutter build appbundle --release
   flutter build ipa --release
   ```

---
