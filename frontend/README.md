# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Sweety – Blood Glucose Tracker

A full-stack blood glucose tracking application built with React, Node.js, Express, and PostgreSQL.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Record up to four glucose readings per day
- View and delete reading history
- Dashboard with glucose summaries and charts
- Daily and monthly reports
- Profile management and input validation

## Tech Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: PostgreSQL
- Authentication: JWT and bcrypt

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/kavi6265/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create `backend/.env` using `backend/.env.example`. Configure the database connection and required secrets.

Create the PostgreSQL database and run the database schema or migration files provided in this repository.

Start the backend using the script defined in `backend/package.json`.

Install frontend dependencies in a second terminal:

```bash
cd frontend
npm install
```

Start the frontend using the script defined in `frontend/package.json`.

## Demo Account

Run the seed script from the backend directory:

```bash
node seed.js
```

Demo email: `demo@sweety.com`

Demo password: `SweetyDemo123!`

## Testing

Document the test commands available in the backend and frontend package files. Include the results of the tests you actually run.

## Notes

- Reading dates are returned as `YYYY-MM-DD` to avoid timezone-related date shifts.
- Demo readings are provided for evaluation purposes.
- Future improvements could include automated tests, deployment, and additional reporting features.
