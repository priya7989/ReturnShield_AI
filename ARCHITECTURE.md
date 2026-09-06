# ReturnShield AI — System Architecture

This document describes the architectural evolution of **ReturnShield AI**, highlighting the **Step 3 Proper RAG + Persistent Memory Architecture**.

---

## 1. Step 3 Architecture (RAG + Persistent Memory Integration)

```mermaid
graph TD
    User["Customer / Admin Supervisor"] -->|1. Click 'Start AI Investigation'| ReactFE["React Dashboard (Vite + Tailwind CSS)"]
    ReactFE -->|2. POST /api/returns/{case_id}/investigate| FastAPI["FastAPI Backend App"]
    
    subgraph FastAPI Backend & LangGraph Orchestrator
        FastAPI -->|Invokes Workflow| Orchestrator["LangGraph Orchestrator (graph.py)"]
        
        subgraph LangGraph Execution Pipeline
            Orchestrator --> OrderAgent["Order Agent"]
            OrderAgent --> CustomerAgent["Customer Agent"]
            CustomerAgent --> PolicyAgent["Policy Agent"]
            PolicyAgent --> FraudAgent["Fraud Agent"]
            FraudAgent --> RiskAgent["Risk Agent"]
            RiskAgent --> DecisionAgent["Decision Agent"]
        end
        
        CustomerAgent -->|Queries Persistent Memory| MemService["Memory Service (memory_service.py)"]
        PolicyAgent -->|Queries Vector Context| RAGRetriever["RAG Retriever (retriever.py)"]
    end
    
    RAGRetriever -->|Semantic Similarity Search| ChromaDB[("ChromaDB Vector Store (./chroma_db)")]
    MemService -->|SQL Queries| Database[("SQLite Database (investigation_memories)")]
    
    DecisionAgent -->|Saves Investigation Memory| MemService
    DecisionAgent -->|Saves Agent Outputs| Database
    FastAPI -->|Returns JSON Payload with RAG & Memory Context| ReactFE
```

---

## 2. Interview-Quality Architectural Concepts

### Why RAG for Policy Retrieval?
Return policies can be long, detailed, and subject to updates across product categories. RAG allows the system to semantically query and inject only the most relevant 3-4 policy passages into the Policy Agent context, keeping token usage low and preventing hallucinations without hard-coding rules.

### Why Persistent Memory?
A return investigation system must maintain long-term memory across multiple return claims for a single customer. Without persistent memory, an abuser could repeatedly submit claims without the system remembering previous recommendations or risk flags.

### Difference Between LangGraph State and Persistent Memory
- **LangGraph State (`InvestigationState`)**: Ephemeral, in-memory dictionary passed between agent nodes during the execution of a single return case investigation.
- **Persistent Memory (`InvestigationMemory`)**: Durable database records saved in SQLite that persist across application restarts, allowing future investigations to recall past decisions, return patterns, and risk observations.

---

## 3. Data Flow Step-by-Step

1. **Trigger**: User clicks **"Start AI Investigation"** on `InvestigationDetail.jsx`.
2. **API Call**: React calls `POST /api/returns/{case_id}/investigate`.
3. **State Initialization**: Orchestrator builds `InvestigationState`.
4. **Order Agent**: Queries `get_order_details()` -> computes `days_since_delivery`.
5. **Customer Agent**: Queries database history AND queries `memory_service.get_customer_memories()` -> retrieves past risk observations.
6. **Policy Agent (RAG)**: Formulates query (e.g. `"Return policy for damaged smartphone delivered 3 days ago"`) -> queries ChromaDB vector store -> retrieves top 4 policy passages -> evaluates eligibility.
7. **Fraud Agent**: Evaluates return ratio, order value, and recent claim frequency -> computes behavioral risk score.
8. **Risk Agent**: Computes composite risk score (0-100) and risk level (`LOW`, `MEDIUM`, `HIGH`).
9. **Decision Agent**: Synthesizes eligibility + risk -> outputs recommendation (`APPROVE_REPLACEMENT`, `APPROVE_REFUND`, `REJECT`, `HUMAN_REVIEW`) -> saves concise memory record via `memory_service.save_memory()`.
10. **UI Render**: React displays Policy Evidence widget (retrieved chunks, source citations), Customer Memory widget, and agent execution cards.
