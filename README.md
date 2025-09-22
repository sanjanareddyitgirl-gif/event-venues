
# Event Venues — Realistic Full-stack Project (SQLite)

This project contains a **backend** (Express + SQLite) and a **frontend** (React + Vite).
Everything is split into `backend/` and `frontend/` folders for clarity.

## Features
- 10 seeded venues (SQLite)
- 5 sponsored ads (images)
- Booking flow with date picker and expected members
- Cancel booking, Buy venue
- AI chat panel that answers questions based on the 10 venues
- Frontend uses Vite with React, and dev server proxies API calls to backend

## Requirements
- Node.js >= 16
- npm (comes with Node.js)
- Git (optional)
- VS Code (recommended)

## Quick start (step-by-step)

### 1) Backend
Open a terminal and run:
```bash
cd backend
npm install
npm start
```
This starts the backend on `http://localhost:3001`. It creates `backend/data/venues.db` with seeded venues and serves images at `http://localhost:3001/images/...` and ads at `http://localhost:3001/ads/...`

### 2) Frontend
Open a second terminal and run:
```bash
cd frontend
npm install
npm run dev
```
This starts the frontend dev server on `http://localhost:5173` and proxies `/api` requests to the backend.

### 3) Preview
Open http://localhost:5173 in your browser.
- The left side shows venue cards (grid)
- The right side shows Ads and AI Chat panel
- Click **Book** on a venue to open the booking modal (pick date and expected members)
- Bookings persist in SQLite database
- Use the chat to ask venue-specific questions (e.g., "Which venue fits 200 guests?" or "Tell me about Grand Hall")

## Troubleshooting
- If you see `vite: not recognized` -> run `npm install` inside frontend and use `npm run dev` or `npx vite`.
- If ports clash change `PORT` in backend `.env` or change Vite port in `frontend/vite.config.js`.
- If frontend cannot load images, ensure backend is running (ads and venue images are served from backend).

## Project structure
```
event-venues-realistic/
  backend/
    server.js
    package.json
    public/
      images/venue1.jpg ... venue10.jpg
      ads/ad1.jpg ... ad5.jpg
    data/venues.db (created at runtime)
  frontend/
    index.html
    package.json
    src/
      App.jsx
      components/
        VenueCard.jsx
        BookingModal.jsx
        ChatPanel.jsx
        AdsPanel.jsx
      styles.css
    vite.config.js
```

If anything fails when you run it, paste the terminal output here and I'll help you fix it.


## SmythOS
To enable SmythOS, create backend/.env with SMYTHOS_API_KEY and SMYTHOS_AGENT_ID and restart backend.
