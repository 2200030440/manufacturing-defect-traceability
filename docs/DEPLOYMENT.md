# TRACE-Q Live Deployment Guide

This guide provides end-to-end instructions for deploying the **TRACE-Q Manufacturing Defect Traceability & Corrective Action System** to production hosting platforms.

---

## Architecture for Live Deployment

TRACE-Q is built to support two production deployment models:

1. **Unified Full-Stack Container (Recommended - Easiest & 100% Free)**:
   A single Docker container builds the React frontend and serves both the FastAPI REST API and the React Single Page Application (SPA) through one web service on **Render**, **Railway**, **Fly.io**, or **Hugging Face Spaces**.
2. **Decoupled Deployment**:
   Frontend deployed on **Vercel** or **Netlify**; Backend API deployed on **Render** or **Railway**.

---

## Option 1: 1-Click Live Deployment on Render (Recommended)

Render offers free hosting with native Docker support.

### Step 1: Push your code to GitHub
If you haven't pushed your code to GitHub yet, follow the [GitHub Setup](#github-setup) section below.

### Step 2: Deploy on Render
1. Go to [https://dashboard.render.com/](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository: `manufacturing-defect-traceability_yottaflexai`.
4. Render will automatically detect `render.yaml` in the root directory.
5. Click **Apply**.
6. Render will:
   - Build the React frontend with Node 20.
   - Install Python 3.11 backend dependencies.
   - Initialize the SQLite database and seed initial demo roles and accounts.
   - Serve the live application on a free `https://<your-app-name>.onrender.com` URL!

---

## Option 2: Deploying on Railway

1. Sign up at [https://railway.app/](https://railway.app/) with GitHub.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will automatically detect the `Dockerfile` and deploy the service.
5. In **Settings** > **Networking**, click **Generate Domain** to get your public live URL (e.g. `https://trace-q.up.railway.app`).

---

## Option 3: Deploying on Fly.io

1. Install the Fly CLI:
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```
2. Authenticate and launch:
   ```bash
   fly auth login
   fly launch
   ```
3. Deploy:
   ```bash
   fly deploy
   ```

---

## Option 4: Decoupled Deployment (Vercel Frontend + Render Backend)

### Backend on Render:
1. In Render, select **New +** > **Web Service**.
2. Select your repository. Set root directory to `backend`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend on Vercel:
1. In Vercel, click **Add New...** > **Project** and import your GitHub repository.
2. Root Directory: `frontend`
3. Framework Preset: `Vite`
4. Set Environment Variable in Vercel:
   `VITE_API_URL`: `https://<your-backend>.onrender.com/api/v1`
5. Click **Deploy**.

---

## GitHub Setup

Follow these exact steps to push this repository to your GitHub account:

### 1. Initialize Git & Create Initial Commit
Open your terminal in the project folder:

```bash
cd "c:\Users\chsiv\OneDrive\Desktop\manufacturing-defect-traceability_yottaflexai"

# Initialize local git repository
git init

# Add all files (the preconfigured .gitignore excludes node_modules and temp files)
git add .

# Create the initial commit
git commit -m "feat: complete TRACE-Q manufacturing defect traceability full-stack system"
```

### 2. Create a New Repository on GitHub
1. Open your browser and go to [https://github.com/new](https://github.com/new).
2. Repository name: `manufacturing-defect-traceability` (or any name you prefer).
3. Visibility: Choose **Public** or **Private**.
4. Do **NOT** initialize with a README, .gitignore, or license (these already exist).
5. Click **Create repository**.

### 3. Connect and Push to GitHub
Copy the repository URL from GitHub and run:

```bash
# Rename branch to main
git branch -M main

# Add your GitHub repository remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/manufacturing-defect-traceability.git

# Push the code to GitHub
git push -u origin main
```

---

## Post-Deployment Verification Checklist

Once deployed to your live URL:
- [ ] Open the live URL in your browser.
- [ ] Confirm the login page displays the 4 quick-login demo role chips.
- [ ] Sign in as **System Admin** (`admin@manufacturing.com` / `Admin@123456`).
- [ ] Verify the **Dashboard** displays live KPI cards and interactive charts.
- [ ] Test the **Traceability Explorer** upstream & downstream graph traversal.
- [ ] Navigate to **Data Generator** and run a simulation.
- [ ] Confirm **Data Validation** detects and lists anomalies with one-click resolution.
