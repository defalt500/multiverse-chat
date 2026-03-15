# Chatbot — Fullstack App

A fullstack real-time chatbot application built with React + Node.js.

## Tech Stack

### Frontend (`/frontend`)
- **React 18** + **TypeScript** via **Vite**
- **Tailwind CSS** for styling
- **React Router v6** for client-side routing
- **Zustand** for global state management
- **Socket.io-client** for real-time communication

### Backend (`/backend`)
- **Node.js** + **Express** + **TypeScript**
- **Socket.io** for real-time events
- **cors** + **dotenv** for configuration
- **ts-node** + **nodemon** for development

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev        # starts on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

## Project Structure

```
chatbot/
├── frontend/
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level page components
│       ├── store/        # Zustand stores
│       ├── hooks/        # Custom React hooks
│       └── types/        # TypeScript type definitions
├── backend/
│   └── src/
│       ├── routes/       # Express route definitions
│       ├── controllers/  # Route handler logic
│       ├── middleware/   # Custom middleware (error handling, auth...)
│       └── types/        # TypeScript type definitions
├── .gitignore
└── README.md
```

## Environment Variables

### Backend (`backend/.env`)
| Variable     | Default                  | Description              |
|-------------|--------------------------|--------------------------|
| `PORT`      | `4000`                   | Server port              |
| `CLIENT_URL`| `http://localhost:5173`  | Allowed CORS origin      |

### Frontend (`frontend/.env`)
| Variable        | Default                 | Description        |
|----------------|-------------------------|--------------------|
| `VITE_API_URL` | `http://localhost:4000` | Backend server URL |
