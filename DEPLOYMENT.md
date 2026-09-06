# Setumarg — Render Deployment Guide (3 Minutes)

This guide walks you through deploying the unified Setumarg platform (React Frontend + FastAPI Backend) onto **Render** for free.

---

### Method 1: Blueprint 1-Click Deployment (Recommended)

1. Sign in to [Render.com](https://render.com) (sign in with your GitHub account).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your repository: Deeppatil-AI/SETUMARG.
4. Render will automatically detect ender.yaml:
   - **Service Name**: setumarg
   - **Runtime**: Python 3.12 (with Node.js 20 build step)
   - **Build Command**: ./build.sh
   - **Start Command**: uvicorn backend.main:app --host 0.0.0.0 --port \
5. Click **Apply**.
6. Render will automatically install Python packages, build the Vite React frontend, and launch the service at https://setumarg.onrender.com.

---

### Method 2: Manual Web Service Setup

If you prefer setting it up manually without Blueprint:

1. On [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **Web Service**.
2. Select your repository: Deeppatil-AI/SETUMARG.
3. Configure the settings:
   - **Name**: setumarg
   - **Region**: Singapore or Frankfurt (lowest latency to India)
   - **Branch**: main
   - **Runtime**: **Python**
   - **Build Command**:
     `ash
     pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..
     `
   - **Start Command**:
     `ash
     uvicorn backend.main:app --host 0.0.0.0 --port \
     `
   - **Instance Type**: **Free**
4. Under **Environment Variables**, add:
   - PYTHON_VERSION: 3.12.0
   - NODE_VERSION: 20.12.0
5. Click **Create Web Service**.

---

### Method 3: Docker Web Service

If you prefer containerized deployment:
1. Click **New +** $\rightarrow$ **Web Service**.
2. Connect Deeppatil-AI/SETUMARG.
3. Select **Docker** runtime (Render will automatically detect Dockerfile).
4. Click **Create Web Service**.

---

### Verification After Deployment

Once deployment finishes:
1. Open your Render URL (e.g. https://setumarg.onrender.com/).
   - The React UI will load directly with live Satellite & Topo maps, Safe Route Finder, Village Hospital Access, and Fleet Tracking.
2. Check the API health:
   - https://setumarg.onrender.com/api/dashboard/stats
   - https://setumarg.onrender.com/api/risk/segments
   - https://setumarg.onrender.com/docs (Interactive Swagger API documentation)
