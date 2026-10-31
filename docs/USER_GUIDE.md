# TRACE-Q End-to-End User Guide

This user guide walks you through the daily operations, quality investigations, and corrective action workflows in **TRACE-Q**.

---

## 1. Quick Login & Role Switching

1. Open the application at **`http://localhost:5173`**.
2. Click any of the quick-login role chips on the login card:
   - **Admin**: Complete system overview, data generation, and settings.
   - **Quality Engineer**: Inspection audits, defect logging, and CAPA reviews.
   - **Production Planner**: BOM structures, production order scheduling.
   - **Plant Operator**: Machine checks, shop floor material consumption.
3. Or manually enter the credentials:
   - `quality@manufacturing.com` / `Quality@123456`

---

## 2. Executive Dashboard & Metrics

Upon signing in, you are greeted by the **Executive Operations Dashboard**:
- **14 Key Performance Indicators (KPIs)**:
  - Total Production Volume & Active Orders.
  - First Pass Yield (FPY %) and Scrap Rate.
  - Total Logged Defects (Critical / Major / Minor breakdown).
  - Open CAPAs and Average Resolution Days.
  - Overall Plant OEE and Supplier Quality Score.
- **Interactive Visualizations**:
  - Defect Distribution by Category.
  - 30-Day Defect & Yield Trendline.
  - Pareto Analysis of Failure Modes.
  - Scrap Cost vs Rework Cost.
- **Audit Feed**: Live log of all state transitions, user logins, and containment actions.

---

## 3. Investigating a Defect via Bi-Directional Traceability

### Step A: Locate the Defect
1. Navigate to **Defects** in the sidebar.
2. Select any defect (e.g. `DEF-000001`). Note its severity, reported failure mode, and linked production order.
3. Click the **Traceability** icon or navigate to **Traceability Explorer**.

### Step B: Trace Upstream (Root Cause Discovery)
1. In the **Traceability Explorer**, search for the Defect ID or Order ID.
2. The **Genealogy Graph** renders the assembly pedigree:
   - **Target Defect** -> Associated **Production Order**.
   - Production Order -> **Consumed Material Lots** (e.g., `LOT-000014 - Aluminum Sheet`).
   - Material Lot -> **Origin Supplier** (e.g., `SUP-000002 - Global Metal Alloys`).
3. View the supplier's contact details, quality rating score, and certificate of analysis.

### Step C: Assess Downstream Blast Radius (Recall Scope)
1. Switch mode or select the identified contaminated material lot.
2. The explorer calculates the **Downstream Blast Radius**:
   - Shows all *other* production orders that consumed material from the same defective lot.
   - Summarizes total finished goods exposed and identifies whether any units have been shipped.
3. Click **Quarantine Lot** to prevent any further shop floor consumption.

---

## 4. Closed-Loop CAPA & 5-Why Investigation

1. Open **CAPA Management** in the sidebar.
2. Click **+ New CAPA** to initiate an action plan from a defect:
   - Enter title, priority (`CRITICAL`, `HIGH`, `MEDIUM`), and assign to a quality lead.
3. Complete the **5-Why Root Cause Drill-down**:
   - *Why 1*: Mechanical vibration detected at bearing housing.
   - *Why 2*: Excessive clearance between shaft and bushing.
   - *Why 3*: Bushing inner diameter out of tolerance on arrival.
   - *Why 4*: Supplier tooling worn beyond gauge tolerance.
   - *Why 5*: Supplier preventative tool-replacement PM schedule skipped.
4. Define:
   - **Immediate Containment**: Quarantine remaining stock in warehouse bin B-12.
   - **Corrective Action**: Supplier recalibrates tooling and replaces all off-spec bushings.
   - **Preventive Action**: Institute incoming CMM dimensional inspection plan on every shipment.
5. **Effectiveness Verification Gate**:
   - Once actions are deployed, the Quality Engineer runs verification.
   - Click **Verify CAPA**, document the evidence (e.g. zero recurring defects over 30 days).
   - Only when verification status is marked **PASSED** can the CAPA be transitioned to **CLOSED**.

---

## 5. Automated Data Validation & Anomaly Resolver

1. Navigate to **Data Validation** in the sidebar.
2. Click **Run Diagnostic Integrity Scan**.
3. The system scans the database against 5 core anomaly patterns:
   - Non-existent lot references.
   - CAPAs prematurely closed without verification.
   - Defect counts exceeding sample sizes.
   - Orders completed without material consumption.
   - Disconnected traceability chains.
4. Review diagnostic logs and click **Remediate / Clean** to restore system consistency.

---

## 6. Seeded Synthetic Data Generator

1. Ensure you are signed in as an **Admin**.
2. Navigate to **Data Generator**.
3. Select your desired scale:
   - **Small**: Quick development set (20 products, 150 orders).
   - **Medium**: Mid-sized operational simulation (50 products, 1,000 orders).
   - **Full**: Full benchmark simulation (200 products, 5,000 orders, 20,000 inspections).
4. Fixed seed `20261022` guarantees identical deterministic generation every time.
5. Click **Start Generation** and observe the live progress monitor.
