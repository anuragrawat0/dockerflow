# DocFlow

DocFlow is a document-processing application built with a FastAPI backend, a Celery worker, Redis, PostgreSQL, and a React/Vite frontend.

The application allows users to:

- upload PDF and TXT files
- queue documents for asynchronous processing
- track status and progress in the UI
- view document details and extracted results
- edit extracted JSON data
- retry failed jobs
- finalize processed documents
- export results as JSON or CSV
- delete uploaded documents

## Architecture Overview

DocFlow is split into four main parts:

1. **Frontend**
   - React + Vite + TypeScript
   - Provides the dashboard, upload flow, progress display, detail view, and export actions
2. **Backend API**
   - FastAPI
   - Handles document uploads, status APIs, retry/finalize operations, exports, and document CRUD actions
3. **Worker**
   - Celery
   - Processes uploaded documents asynchronously and updates progress/status
4. **Infrastructure**
   - PostgreSQL for persistent document metadata/results
   - Redis for Celery broker/backend and progress state polling
   - Docker Compose is used to run Redis and PostgreSQL locally

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, Pydantic Settings
- **Worker:** Celery, Redis
- **Database:** PostgreSQL
- **Frontend:** React, TypeScript, Vite, React Router
- **Styling:** Tailwind CSS
- **Containers:** Docker Compose

## Project Structure

```text
docFlow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── workers/
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── docker-compose.yml
```

## Features

- immediate upload from the main UI
- real-time progress polling
- dashboard with status filtering
- document detail page
- retry for failed jobs
- finalize workflow
- JSON and CSV export
- document deletion

## Prerequisites

Make sure the following are installed before setup:

### Required

- **Python 3.12+**
- **Node.js 18+** and **npm**
- **Docker Desktop** or Docker Engine with Compose support

### Recommended

- A modern browser
- PowerShell or Command Prompt on Windows

## Local Development Setup

### 1. Clone or open the project

```bash
git clone <your-repo-url>
cd docFlow
```

If the project already exists locally, just open the `docFlow` folder.

### 2. Start PostgreSQL and Redis with Docker

From the project root:

```bash
docker compose up -d
```

This starts:

- **PostgreSQL** on `localhost:5433`
- **Redis** on `localhost:6379`

Verify containers:

```bash
docker compose ps
```

### 3. Backend setup

Open a terminal and move to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

Command Prompt:

```bash
venv\Scripts\activate
```

PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 4. Backend environment configuration

Create a `.env` file inside `backend/` if it does not already exist.

`backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/docs
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1
UPLOAD_DIR=./uploads
```

Variable explanation:

- `DATABASE_URL` - PostgreSQL connection used by FastAPI and the worker
- `REDIS_URL` - Redis location used for progress polling state
- `CELERY_BROKER_URL` - queue broker used by Celery
- `CELERY_RESULT_BACKEND` - Celery result backend
- `UPLOAD_DIR` - folder where uploaded files are stored locally

### 5. Run the FastAPI backend

From the `backend/` directory with the virtual environment activated:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:

- `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 6. Run the Celery worker

Open a second terminal, go to `backend/`, and activate the same virtual environment.

Command Prompt:

```bash
cd backend
venv\Scripts\activate
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

PowerShell:

```powershell
cd backend
venv\Scripts\Activate.ps1
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

The worker listens for queued document-processing tasks and updates progress/state.

### 7. Frontend setup

Open a third terminal and move to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Vite will usually start on:

- `http://localhost:5173`

## Running the Full Stack

You should have these processes running at the same time:

1. **Docker services**
   ```bash
   docker compose up -d
   ```
2. **FastAPI backend**
   ```bash
   cd backend
   venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```
3. **Celery worker**
   ```bash
   cd backend
   venv\Scripts\activate
   celery -A app.workers.celery_app.celery_app worker --loglevel=info
   ```
4. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Then open `http://localhost:5173` in your browser.

## How the App Works

### Upload flow

1. Click the **Upload** button in the frontend.
2. Select a PDF or TXT file.
3. FastAPI saves the file and creates a document record with `queued` status.
4. The backend enqueues a Celery task.
5. The worker processes the file and updates progress in Redis and PostgreSQL.
6. The frontend polls progress and updates the UI in real time.

### Document states

Common document statuses include:

- `queued`
- `processing`
- `completed`
- `failed`
- `finalized`

## API Overview

Base URL:

```text
http://localhost:8000/api
```

Main endpoints:

- `POST /upload` - upload a document
- `GET /documents` - list documents
- `GET /documents/{id}` - get document details
- `GET /documents/{id}/progress` - fetch live progress
- `POST /documents/{id}/retry` - retry failed processing
- `PUT /documents/{id}` - update extracted result
- `POST /documents/{id}/finalize` - finalize document
- `DELETE /documents/{id}` - delete document
- `GET /documents/{id}/export/json` - download JSON export
- `GET /documents/{id}/export/csv` - download CSV export

## Frontend Scripts

From `frontend/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Script meanings:

- `npm run dev` - start Vite dev server
- `npm run build` - build production frontend bundle
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint

## Backend Dependencies

Current backend dependencies from `backend/requirements.txt`:

```txt
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
celery[redis]
redis
python-multipart
pydantic-settings
```

## Useful Development Commands

Rebuild frontend:

```bash
cd frontend
npm run build
```

Verify backend Python syntax:

```bash
python -m compileall backend/app
```

Stop Docker services:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

## Troubleshooting

### 1. Upload fails with Celery broker connection errors

If you see errors such as `kombu.exceptions.OperationalError`, check that Redis is running and that `backend/.env` contains:

```env
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

Then restart both:

- FastAPI backend
- Celery worker

### 2. Progress stays at `unknown` or `0%`

Check the following:

- Celery worker is running
- Redis is running
- worker task code is updating Redis progress state
- frontend can reach `GET /api/documents/{id}/progress`

Also confirm new uploads appear in the database-backed dashboard.

### 3. CORS errors in browser

The backend currently allows local frontend development origins. If the frontend runs on a different port or host, update the FastAPI CORS settings in `backend/app/main.py`.

### 4. Database connection issues

Make sure PostgreSQL is available on `localhost:5433`.

Check Docker status:

```bash
docker compose ps
```

### 5. Redis connection issues

Make sure Redis is available on `localhost:6379`.

### 6. CSV/JSON export problems

Exports depend on the document having a parsed `result`. If export returns `404 No result`, the document either:

- has not finished processing
- failed processing
- does not yet contain extracted data

### 7. Worker appears idle

Make sure the worker is started with the correct application:

```bash
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

Using a different app target may prevent tasks from being discovered or executed correctly.

## Development Notes

- PostgreSQL and Redis are containerized through Docker Compose
- FastAPI, Celery worker, and frontend run locally on the host machine
- Uploaded files are stored under `backend/uploads/`
- The backend creates database tables on startup via SQLAlchemy metadata

## Ports Summary

| Service | Port |
| --- | --- |
| Frontend | 5173 |
| Backend | 8000 |
| PostgreSQL | 5433 |
| Redis | 6379 |

## Example Startup Order

Recommended order when starting the app manually:

1. Start infrastructure:
   ```bash
   docker compose up -d
   ```
2. Start backend:
   ```bash
   cd backend
   venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```
3. Start worker:
   ```bash
   cd backend
   venv\Scripts\activate
   celery -A app.workers.celery_app.celery_app worker --loglevel=info
   ```
4. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## License

Add your project license information here if needed.
