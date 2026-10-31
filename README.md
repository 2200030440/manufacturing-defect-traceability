# TRACE-Q: Manufacturing Defect Traceability & Corrective Action Management System

<div align="center">

[![Live Application](https://img.shields.io/badge/LIVE%20DEMO-ACCESS%20APP-00C853?style=for-the-badge&logo=render&logoColor=white)](https://manufacturing-defect-traceability-1.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GITHUB-SOURCE%20CODE-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/2200030440/manufacturing-defect-traceability)
[![API Documentation](https://img.shields.io/badge/SWAGGER-API%20DOCS-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://manufacturing-defect-traceability-1.onrender.com/api/docs)

**An enterprise-grade, full-stack Manufacturing Execution & Quality Management Platform (MES/QMS)**  
*Engineered to ISO 9001 and IATF 16949 automotive/aerospace standards for zero-defect manufacturing.*

</div>

---

### Instant Demo Access & Login Credentials

Click the **[Live Demo Link](https://manufacturing-defect-traceability-1.onrender.com)** to test the live application. The system provides one-click role demo profiles on the login screen, or you can use the credentials below:

| Role | Email | Password | Access Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@manufacturing.com` | `Admin@123456` | Full platform control, deterministic simulation engine, system audit logs |
| **Quality Engineer** | `quality@manufacturing.com` | `Quality@123456` | AQL inspection plans, defect logging, quarantine locks, CAPA 5-Why verification |
| **Production Planner**| `planner@manufacturing.com` | `Planner@123456` | Work orders, multi-level BOM revisions, line scheduling, material allocation |
| **Plant Operator** | `operator@manufacturing.com` | `Operator@123456` | Shop floor material consumption, station execution logs, machine telemetry |

---

## 1. Project Overview

In high-reliability manufacturing (automotive, electronics, medical devices, aerospace), a single component defect can cause catastrophic product recalls, severe financial loss, and safety risks. 

**TRACE-Q** solves this by providing:
1. **Bi-Directional Genealogy**: Instantly trace any defective finished product backward to the exact supplier lot, or search a contaminated raw material lot to pinpoint every affected customer order (the "blast radius").
2. **Closed-Loop Corrective Action (CAPA)**: An 8D problem-solving engine powered by the **5-Why Root Cause Analysis** framework with immutable verification gates.
3. **Automated Anomaly Detection**: An automated scanner continuously diagnosing structural data discrepancies (orphaned defects, bypassed verification, over-reported defects).
4. **Real-Time Operational Analytics**: 14 live KPIs and 10 interactive charts tracking First Pass Yield (FPY), Scrap Costs, MTBF, and Defect Pareto distributions.

---

## 2. System Mindmap

Below is the complete conceptual architecture and functional breakdown of the TRACE-Q platform:

```mermaid
mindmap
  root((TRACE-Q Platform))
    Master Data Governance
      Product Catalog
        SKU Management
        Standard Production Time
        Lifecycle Statuses
      Bills of Materials (BOM)
        Multi-Level Revisions
        Component Ratios
        Scrap Factors
      Supplier Ecosystem
        Vendor Performance Scoring
        Certificates of Analysis
        Audit History
      Machine Assets
        Station Telemetry
        Operational Run Hours
        OEE Metrics
    Shop Floor Execution
      Production Orders
        Scheduling & Release
        Actual vs Planned Yield
        Yield & Scrap Accounting
      Material Consumption
        Lot-to-Order Genealogy
        Timestamped Consumption
        FIFO Consumption Verification
      Process Step Routing
        Cycle Time Tracking
        Operator Sign-Offs
        Workstation Execution
    Quality Assurance
      Inspection Plans
        AQL ISO 2859-1 Standards
        Sampling Sizes
        Pass/Fail Thresholds
      Inspection Audits
        Incoming Raw Materials
        In-Process Assembly
        Final Outgoing QA
      Defect Management
        Severity Classification
        Failure Mode Attribution
        4M Root Cause Mapping
      Containment Quarantine
        Immediate Lot Freezing
        Physical Disposition Scraps/Rework
    Traceability Engine
      Upstream Pedigree
        Defect to Work Order
        Work Order to Consumed Lots
        Lots to Origin Supplier
      Downstream Exposure
        Contaminated Lot Ingestion
        Affected Order Blast Radius
        Fleet Quarantine Locks
    Closed-Loop CAPA
      8D Problem Formulation
      5-Why Root Cause Drill-down
      Containment & Preventative Actions
      Verification Gates (Passed/Failed)
    Analytics & Diagnostics
      14 Real-Time Executive KPIs
      10 Interactive Visual Charts
      5-Rule Automated Anomaly Detector
      Seeded Deterministic Simulation
```

---

## 3. The Complete Manufacturing Quality Workflow

Here is the step-by-step lifecycle of how data moves through TRACE-Q on the factory floor:

```mermaid
sequenceDiagram
    autonumber
    actor Supplier as Supplier / Vendor
    actor Receiving as Inbound Warehouse
    actor Line as Shop Floor Assembly
    actor QA as Quality Control
    actor Eng as Quality Engineering
    
    Supplier->>Receiving: Deliver Raw Materials (Batch / Lot)
    Receiving->>QA: Inbound AQL Inspection
    alt Inspection Passes
        QA-->>Receiving: Approve Lot for Production
    else Inspection Fails
        QA-->>Receiving: Quarantine Lot & Block Consumption
    end
    
    Line->>Receiving: Pull Approved Material Lot
    Line->>Line: Execute Work Order Steps & Log Consumption
    Line->>QA: Submit Finished Assembly for Final Inspection
    
    QA->>QA: Execute Inspection Plan (AQL Standard)
    opt Defect Discovered
        QA->>Eng: Log Defect (Severity, Failure Mode, Order ID)
        Eng->>Eng: Open Bi-Directional Traceability Explorer
        Eng->>Receiving: Trace Upstream Pedigree -> Identify Defective Supplier Lot
        Eng->>Line: Compute Downstream Blast Radius -> Quarantine All Sibling Orders
        Eng->>Eng: Initiate Formal CAPA Investigation
        Eng->>Eng: Execute 5-Why Root Cause Drill-down
        Eng->>Supplier: Issue Corrective Action Request to Vendor
        Eng->>QA: Run Effectiveness Verification Audit
        QA-->>Eng: Verification PASSED -> CAPA Formally Closed
    end
```

### Detailed Stage Breakdown:

1. **Inbound Receiving & Supplier Lot Registration**:
   Raw materials enter the warehouse with unique lot barcodes, batch IDs, expiration dates, and vendor certifications.
2. **Work Order Release & Material Consumption**:
   When a production order begins, operators consume material from specific active lots. Every consumed kilogram, meter, or piece is permanently bound to the order's serial genealogy.
3. **Station Telemetry & Routing**:
   The order moves through defined process steps (SMT Placement, Wave Soldering, Automated Optical Inspection, Final Assembly) with cycle time logging.
4. **Quality Inspection & Defect Discovery**:
   Inspectors audit batches against predefined AQL sampling limits. If non-conformance is identified, a defect record is created with severity, defect category, and photographed failure evidence.
5. **Bi-Directional Traceability Isolation**:
   - **Upstream**: With one click, the system parses the bill of materials and consumption logs to identify the exact raw material lot and supplier behind the failure.
   - **Downstream**: The system immediately isolates all *other* work orders that consumed material from the same suspect lot, preventing contaminated units from shipping.
6. **Closed-Loop CAPA & 5-Why Root Cause Analysis**:
   A formal CAPA is opened. Quality leads execute a 5-Why investigation to drill past superficial symptoms to the root systemic cause.
7. **Verification Gate**:
   A CAPA cannot be marked `CLOSED` by an operator. A Quality Engineer must perform an audit, document evidence of non-recurrence, and pass the verification gate.
8. **Automated Data Validation & Anomaly Detection**:
   An integrity scanner runs across all relational tables to ensure no orphaned defects, ghost work orders, or bypassed CAPA verifications exist.

---

## 4. Key Modules & Functional Capabilities

### 🔍 Bi-Directional Traceability Explorer
The crown jewel of TRACE-Q. Supports dual-mode supply chain genealogy:
- **Upstream Mode (Root-Cause Investigation)**:
  Input a Defect ID (e.g. `DEF-000001`) or Order ID &rarr; reveals the complete pedigree tree including production workstation, operator, consumed lot numbers, and supplier company profile.
- **Downstream Mode (Recall Blast Radius Containment)**:
  Input a Material Lot ID &rarr; calculates every downstream production order that consumed that lot, showing units produced, warehouse status, and secondary defects.

---

### 🛡️ Closed-Loop CAPA & 5-Why Engine
Complies with global manufacturing quality frameworks (8D, Six Sigma, IATF 16949):
- **5-Why Drill-Down**: Interactive questioning steps forcing teams to identify systemic process failures.
- **3-Tier Action Plan**:
  - *Immediate Containment*: Physical quarantine, segregation, and stop-ship orders.
  - *Corrective Action*: Process parameter adjustment, tooling recalibration, or vendor audit.
  - *Preventive Action*: SOP updates, incoming inspection threshold tightening, and Poka-Yoke error proofing.
- **Verification Gate**: Hard-coded system gate requiring documented proof and signed audit clearance before status can transition to `CLOSED`.

---

### ⚙️ Automated Anomaly Detection Engine
A specialized diagnostic scanner testing database integrity across 5 core industrial rules:

| Rule Code | Anomaly Pattern | Industrial Impact | Resolution Mechanism |
| :--- | :--- | :--- | :--- |
| **ANOM-001** | `NONEXISTENT_LOT` | Defect linked to invalid lot ID; breaks traceability pedigree | Re-links defect to valid consumption record |
| **ANOM-002** | `CAPA_CLOSED_BEFORE_VERIFICATION` | CAPA marked closed while verification is still pending; ISO non-conformance | Reverts CAPA to under-investigation |
| **ANOM-003** | `DEFECT_COUNT_EXCEEDS_INSPECTED` | Reported defective count exceeds sample size inspected | Normalizes count to physical sample |
| **ANOM-004** | `BOM_MATERIAL_NOT_CONSUMED` | Completed work order with zero material consumption logged | Flags phantom production for shop floor audit |
| **ANOM-005** | `BROKEN_TRACEABILITY_CHAIN` | Orphaned defect lacking order, lot, and inspection links | Assigns containment and attaches parent order |

---

### 📊 Real-Time Operations Dashboard & Analytics
- **14 High-Impact KPIs**: Total Production Volume, Active Work Orders, First Pass Yield (FPY %), Overall Scrap Rate, Total Logged Defects, Open CAPAs, Average CAPA Closure Cycle (days), and Plant OEE.
- **10 Interactive Charts**: 30-day quality trendlines, Pareto defect classification, machine-specific defect heatmaps, scrap cost vs rework expenditure, and live audit event stream.

---

### 🎲 Deterministic Simulation Engine
Includes a built-in test data generator utilizing a fixed mathematical seed (`20261022`) to produce reproducible manufacturing datasets:
- Generates 200 Products, 50 Suppliers, 2,000 Material Lots, 5,000 Production Orders, and 20,000 Inspection records.
- Deterministically injects real-world anomaly patterns to evaluate diagnostic scanning accuracy.
- Available via both the Web UI and Python CLI.

---

## 5. Technology Stack & Architecture

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18.3 + TypeScript** | Strongly typed Single Page Application with zero runtime errors |
| **Styling** | **Tailwind CSS 3.4** | Clean slate/navy enterprise dashboard design system |
| **Data Viz** | **Recharts 2.13** | Dynamic responsive SVG charts (Pareto, Area, Line, Bar) |
| **Icons** | **Lucide React** | High-clarity iconography across all 18 operational views |
| **Backend Engine**| **FastAPI (Python 3.11+)**| High-throughput async REST API with automatic OpenAPI documentation |
| **Database ORM** | **SQLAlchemy 2.0** | Declarative data models with SQLite native storage & PostgreSQL compatibility |
| **Authentication**| **Stateless JWT + Bcrypt**| Role-Based Access Control (RBAC) with salted password hashing |
| **Packaging** | **Docker Multi-Stage** | Single-container deployment building frontend and serving full stack |

---

## 6. Local Quick Start Guide

### Prerequisites
- Python 3.10+ & Node.js 18+
- Git

### 1. Clone & Run the Backend
```bash
# Clone the repository
git clone https://github.com/2200030440/manufacturing-defect-traceability.git
cd manufacturing-defect-traceability/backend

# Install dependencies
pip install -r requirements.txt

# Start the API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

### 2. Run the Frontend UI
```bash
# In a new terminal window
cd manufacturing-defect-traceability/frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 7. Running the Automated Test Suite

The test suite validates data models, role authorization, supply chain graph traversal, and anomaly detection rules:

```bash
cd backend
python -m pytest tests -v
```

**Results**: `10 passed in 8.24s` (100% pass rate).

---

## 8. Project Structure

```
├── Dockerfile                  # Multi-stage production container build
├── docker-compose.yml          # Container orchestration specification
├── render.yaml                 # 1-click cloud deployment blueprint
├── .gitignore                  # Git tracking exclusion rules
├── README.md                   # System documentation & architectural guide
├── docs/                       # Technical documentation
│   ├── ARCHITECTURE.md         # Database ERD and traversal algorithms
│   ├── DEPLOYMENT.md           # Cloud deployment instructions
│   ├── USER_GUIDE.md           # Operational end-user walkthrough
│   ├── ground_truth.json       # Anomaly simulation ground-truth mappings
│   └── ground_truth.csv        # Anomaly simulation CSV export
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # 22 REST API endpoint routers
│   │   ├── core/               # Database engine, security, and configuration
│   │   ├── models/             # SQLAlchemy ORM declarative models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # ID generator and seed services
│   │   └── main.py             # FastAPI entry point & SPA static handler
│   ├── data_generator/         # Deterministic data generation engine
│   └── tests/                  # Pytest automated test suite
└── frontend/
    ├── src/
    │   ├── components/         # Reusable UI components (Sidebar, Header, Modal)
    │   ├── context/            # AuthContext & role state
    │   ├── pages/              # 18 operational views
    │   ├── services/           # REST API client
    │   ├── types/              # TypeScript interfaces
    │   ├── App.tsx             # Route declarations
    │   └── main.tsx            # React application entry point
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

<div align="center">

**TRACE-Q Manufacturing Defect Traceability System**  
Built for high-reliability manufacturing, quality engineering, and supply chain accountability.

</div>
