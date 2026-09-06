# ReturnShield AI — Autonomous E-Commerce Returns & Refund Investigation System

> **Step 3: Proper RAG + Persistent Memory Architecture**

---

## 1. Project Purpose

E-commerce businesses process thousands of return and refund requests daily. Traditional manual investigation of claims—verifying order history, checking serial returners, validating product warranties, inspecting damaged product photos, and matching store refund policies—is slow, costly, and vulnerable to return fraud (e.g., wardrobing, empty box returns, damaged claims).

**ReturnShield AI** is an enterprise-grade agentic AI platform that automates returns investigation end-to-end.

---

## 2. Step 3 Architecture Overview

In **Step 3**, we introduced:
1. **Proper Vector RAG Pipeline (ChromaDB)** for policy retrieval instead of full document reading.
2. **Persistent Investigation Memory (SQLite)** for long-term customer risk tracking across claims.

```
Customer Claim Submission / Start AI Investigation
       │
       ▼
React Dashboard (Vite + Tailwind CSS + Lucide Icons)
       │ POST /api/returns/{case_id}/investigate
       ▼
FastAPI Backend App (Python 3.10+)
       │
       ▼
LangGraph Orchestrator (app/agents/graph.py)
       │
       ├── 1. Order Agent      (app/agents/order_agent.py)
       ├── 2. Customer Agent   (app/agents/customer_agent.py & app/memory/memory_service.py)
       ├── 3. Policy Agent     (app/agents/policy_agent.py & app/rag/retriever.py ──> ChromaDB Vector Store)
       ├── 4. Fraud Agent      (app/agents/fraud_agent.py)
       ├── 5. Risk Agent       (app/agents/risk_agent.py)
       └── 6. Decision Agent   (app/agents/decision_agent.py)
       │
       ├── Service Tools Layer (app/services/investigation_service.py)
       │
       ├── Persistence: InvestigationMemory (SQLite)
       └── Vector Store: ChromaDB (backend/chroma_db)
```

---

## 3. RAG Architecture & Vector Indexing

### Why RAG for Return Policy Retrieval?
Return policies can be large, change frequently, and vary by product category. Sending entire policy documents in LLM prompts is wasteful and expensive. With RAG (Retrieval-Augmented Generation):
- `knowledge/return_policy.md` is chunked by markdown section headers into structured policy passages with metadata (`source`, `document_type`, `section`).
- Chunks are embedded and persisted in a local **ChromaDB** collection (`return_policy` stored in `./chroma_db`).
- The **Policy Agent** formulates targeted semantic queries (e.g., `"Return policy for damaged smartphone delivered 3 days ago"`), retrieves the top 4 matching policy chunks, and evaluates eligibility against retrieved evidence.

---

## 4. Persistent Memory Architecture

### Why Persistent Memory?
Each return investigation should not start from scratch without historical context.
- **State vs. Memory**:
  - *LangGraph State*: Temporary typed dictionary passed between agent nodes during a single investigation run.
  - *Persistent Memory*: High-value investigation observations stored in SQLite (`investigation_memories` table) that persist across server restarts and future claims.
- **Customer Agent Memory Integration**: When investigating a customer, the Customer Agent queries `memory_service.get_customer_memories()`, incorporating past risk observations, policy outcomes, and previous decisions into the fraud evaluation.

---

## 5. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning `{"status": "healthy"}` |
| `GET` | `/api/customers` | Retrieve list of all customers |
| `GET` | `/api/products` | Retrieve catalog products |
| `GET` | `/api/orders` | Retrieve customer orders with product details |
| `GET` | `/api/returns` | List all return cases (supports `status_filter` & `risk_filter`) |
| `GET` | `/api/returns/{case_id}` | Detailed return case with customer, order, product, & evidence |
| `POST` | `/api/returns` | Create a new return investigation case |
| `POST` | `/api/returns/{case_id}/evidence` | Upload evidence image/file for a case |
| `PATCH` | `/api/returns/{case_id}` | Update status, risk level, or decision text |
| `POST` | `/api/returns/{case_id}/investigate` | Step 2/3: Trigger LangGraph Multi-Agent Investigation |
| `GET` | `/api/returns/{case_id}/results` | Step 2/3: Retrieve saved historical agent execution logs |
| `GET` | `/api/customers/{customer_id}/memories` | **Step 3**: Retrieve customer persistent memories |
| `GET` | `/api/returns/{case_id}/memories` | **Step 3**: Retrieve case persistent memories |
| `POST` | `/api/rag/reindex` | **Step 3**: Force re-indexing of `return_policy.md` into ChromaDB |

---

## 6. How to Run the Project Locally

### Backend Setup (FastAPI + ChromaDB RAG + Memory)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run automated Step 3 RAG & Memory test suite
python test_step3_rag_memory.py

# 5. Run FastAPI backend
uvicorn app.main:app --reload --port 8000
```
Backend API docs available at `http://localhost:8000/docs`.

### Frontend Setup (React + Vite)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies & build check
npm run build

# 3. Run development server
npm run dev
```
Frontend Dashboard available at `http://localhost:5173`.
