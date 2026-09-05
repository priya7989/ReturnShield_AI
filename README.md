# ReturnShield AI — Autonomous E-Commerce Returns & Refund Investigation System

> **Step 1: Foundational Architecture & Operational Dashboard**

---

## 1. Project Purpose

E-commerce businesses process thousands of return and refund requests daily. Traditional manual investigation of claims—verifying order history, checking serial returners, validating product warranties, inspecting damaged product photos, and matching store refund policies—is slow, costly, and vulnerable to return fraud (e.g., wardrobing, empty box returns, damaged claims).

**ReturnShield AI** is designed as an enterprise-grade agentic AI platform that automates returns investigation end-to-end. 

In **Step 1**, we have built the foundational infrastructure:
- Database schema for all core e-commerce entities
- REST API layer with full Pydantic request validation
- Service layer designed to serve as tools for future AI agents
- Real-time dark-themed operational dashboard for human supervisors
- Seed dataset with realistic customers, catalog products, orders, return claims, and evidence files.

---

## 2. Step 1 Architecture Overview

```
User / Admin Supervisor
       │
       ▼
React Dashboard (Vite + Tailwind CSS + Lucide Icons)
       │ HTTP / REST API (CORS enabled)
       ▼
FastAPI Backend App (Python 3.10+)
       │
       ├── Service Layer (app/services/investigation_service.py)
       │    └── Modular functions prepared to be exported as AI Agent Tools
       │
       ├── Uploads Manager (/uploads static mount for evidence files)
       │
       ▼
SQLite Database (SQLAlchemy ORM models)
```

---

## 3. Database Entities

### Customer (`customers`)
- `id`: Integer Primary Key
- `name`: Customer full name
- `email`: Unique email address
- `phone`: Contact phone number
- `created_at`: Registration timestamp

### Product (`products`)
- `id`: Integer Primary Key
- `name`: Product title
- `category`: Category (e.g., Smartphones, Audio, Laptops)
- `price`: Unit price in USD
- `seller`: Seller / Authorized distributor name
- `warranty_period`: Warranty term (e.g., "12 Months", "24 Months")
- `created_at`: Timestamp

### Order (`orders`)
- `id`: Integer Primary Key
- `order_number`: Unique identifier (e.g., `ORD-10024`)
- `customer_id`: Foreign Key (`customers.id`)
- `product_id`: Foreign Key (`products.id`)
- `order_date`: Date order was placed
- `delivery_date`: Date delivered (nullable)
- `amount`: Order total amount
- `status`: Order status (`Delivered`, `In Transit`, `Returned`)

### ReturnCase (`return_cases`)
- `id`: Integer Primary Key
- `case_number`: Unique case ID (e.g., `RET-2026-0001-A9F1`)
- `order_id`: Foreign Key (`orders.id`)
- `customer_id`: Foreign Key (`customers.id`)
- `reason`: Claim category (`Damaged product`, `Defective item`, etc.)
- `description`: Detailed customer complaint statement
- `status`: Claim status (`Pending`, `Approved`, `Rejected`, `Needs Human Review`)
- `risk_level`: Fraud/risk classification (`Low`, `Medium`, `High`, `Unassessed`)
- `final_decision`: Summary determination string
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### Evidence (`evidence`)
- `id`: Integer Primary Key
- `return_case_id`: Foreign Key (`return_cases.id`)
- `file_name`: Original uploaded filename
- `file_path`: Relative URL path (`/uploads/filename`)
- `evidence_type`: MIME type (`image/jpeg`, `image/png`, `image/svg+xml`)
- `uploaded_at`: Upload timestamp

---

## 4. Backend REST API Endpoints

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

---

## 5. Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx       # Operations navigation sidebar
│   │   ├── Navbar.jsx        # Top bar with real-time backend health polling
│   │   ├── StatusBadge.jsx   # Color-coded status & risk badges
│   │   ├── MetricCard.jsx    # Metric statistic cards
│   │   └── Timeline.jsx      # Investigation timeline (Step 1 + Step 2 AI stages)
│   ├── pages/
│   │   ├── Dashboard.jsx            # High-level stats & recent investigations table
│   │   ├── Investigations.jsx       # Filterable & searchable investigation directory
│   │   ├── InvestigationDetail.jsx  # Detailed case file, evidence gallery, timeline
│   │   └── NewInvestigation.jsx     # Claim submission form with image uploader
│   ├── services/
│   │   └── api.js            # Axios client wrappers for all REST endpoints
│   ├── App.jsx               # Application routes
│   ├── main.jsx              # React DOM mounting
│   └── index.css             # Tailwind imports & dark enterprise styling
├── package.json
└── vite.config.js
```

---

## 6. How to Run the Project locally

### Backend Setup (FastAPI)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Seed database (creates SQLite DB & loads 5 customers, 10 products, 15 orders, 5 return cases)
python app/seed.py

# 6. Run FastAPI application
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### Frontend Setup (React + Vite)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Frontend Dashboard will open at `http://localhost:5173`.

---

## 7. What is Intentionally NOT Implemented in Step 1

To keep Step 1 focused purely on clean architectural foundation:
- ❌ No LLM or VLM calls (OpenAI, Gemini, Claude, etc.)
- ❌ No LangGraph orchestrator or autonomous multi-agent loops
- ❌ No Vector database or RAG policy document search
- ❌ No external payment / refund API triggers (Stripe, Shopify)

The timeline UI explicitly marks AI stages as **"Step 2+ Coming Soon"**.

---

## 8. How this Foundation Supports Future AI Agents

In Step 2+, we will attach LangGraph / LangChain autonomous agents. Each agent will directly call the service functions created in `app/services/investigation_service.py` as structured tools:

1. **Vision Agent**: Calls `get_return_case()` to inspect image evidence at `file_path`.
2. **Order Agent**: Calls `get_order_details()` to inspect delivery timestamps and return windows.
3. **Policy / RAG Agent**: Calls `get_product_details()` to evaluate warranty and refund policy rules.
4. **Fraud Agent**: Calls `get_customer_history()` & `get_customer_return_history()` to detect serial return abuse.
5. **Decision Agent**: Synthesizes agent reports and invokes `add_investigation_result()` or `update_return_case()`.

---

## 9. Testing API Endpoints

You can verify the backend APIs anytime by running the automated test script:

```bash
cd backend
python test_api.py
```

Or manually via `curl`:

```bash
# Health Check
curl http://localhost:8000/api/health

# List Returns
curl http://localhost:8000/api/returns

# View Specific Return Case
curl http://localhost:8000/api/returns/1
```
