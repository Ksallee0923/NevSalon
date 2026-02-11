# NevSalon

This repository contains the NeverEndz Salon website and a small Node/Express backend for booking submissions.

## Project structure

- `NeverEndz Salon/` — static frontend pages (HTML/CSS/JS + images).
- `NeverEndz Salon/backend/` — Express API with SQLite support.

## Quick start

### 1) Install backend dependencies

```bash
cd "NeverEndz Salon/backend"
npm install
```

### 2) Start backend API

```bash
npm start
```

The backend listens on `http://localhost:4000` and exposes:

- `GET /` health message
- `POST /api/bookings` for booking submissions
- `GET /api/bookings` to list bookings

### 3) Open frontend

Open `NeverEndz Salon/index.html` in your browser, or serve the folder with a static server.

## Notes

- This repo now ignores dependency folders and local database/log artifacts via `.gitignore`.
- If you use a different frontend origin while developing, update CORS settings in `NeverEndz Salon/backend/server.js`.
