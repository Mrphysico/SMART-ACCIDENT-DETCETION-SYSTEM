# Government Accident Detection System

The project is divided by responsibility:

| Folder | What it contains |
| --- | --- |
| `backend/` | FastAPI server, API routes, database models, seed data, and accident simulator |
| `frontend/` | Browser dashboard (`index.html`) |
| `mobile/` | Expo/React Native responder application |

## Start manually

Run these commands from the project root. No batch file is required.

### 1. Backend and website

```powershell
python -m pip install -r backend/requirements.txt
python backend/run.py
```

Open <http://127.0.0.1:8000>. The backend serves the dashboard from `frontend/index.html`. API documentation is at <http://127.0.0.1:8000/docs>.

### 2. Accident simulator (optional)

Keep the backend running, open another terminal, then run:

```powershell
python backend/simulator/simulator.py --single
```

Remove `--single` to generate an accident every 30 seconds.

### 3. Mobile application (optional)

```powershell
cd mobile
npm install
npm start
```

When testing on a physical phone, replace `127.0.0.1` in `mobile/App.js` with the computer's local network IP address.

## Important files

| File | Purpose |
| --- | --- |
| `backend/run.py` | Starts the API server |
| `backend/app/main.py` | Creates the FastAPI app and connects its routes |
| `backend/app/routes/` | API endpoints grouped by feature |
| `backend/app/models.py` | Database tables |
| `backend/app/schemas.py` | Request and response data shapes |
| `backend/app/database.py` | Database connection |
| `backend/seed_india_data.py` | Optional India sample-data seeder |
| `backend/simulator/simulator.py` | Sends fake accident telemetry for testing |
| `frontend/index.html` | Complete browser dashboard |
| `mobile/App.js` | Main mobile app screen and logic |
| `mobile/package.json` | Mobile dependencies and start commands |

The SQLite data remains in `backend/accident_system.db`, regardless of which folder the start command is run from.
