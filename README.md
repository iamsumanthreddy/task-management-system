# Task Management System

A full-stack task management application built with NestJS, TypeORM, PostgreSQL, and Next.js.

**Live Demo:** [https://task-management-system-blush-nine.vercel.app](https://task-management-system-blush-nine.vercel.app)

## Tech Stack

### Backend
- **NestJS** (Node.js + TypeScript)
- **TypeORM** (ORM)
- **PostgreSQL** (Database)
- **JWT** (Access + Refresh Token authentication)
- **bcrypt** (Password hashing)
- **class-validator** (Input validation)

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (Responsive design)
- **react-hot-toast** (Notifications)

## Features

### Authentication
- User registration with email and password
- Login with JWT-based authentication (Access + Refresh tokens)
- Password strength validation (min 8 chars, uppercase, lowercase, number, special character)
- Forgot password with OTP verification
- Secure logout with token revocation
- Profile setup (name, date of birth, gender, profile picture)

### Task Management
- Create, view, edit, and delete tasks
- Toggle task status (pending/completed)
- Task priority levels (low, medium, high)
- Due date support
- Search tasks by title
- Filter tasks by status
- Paginated task list

### UI/UX
- Fully responsive design (desktop + mobile)
- Toast notifications for all operations
- Profile picture upload
- Clean, modern interface

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/forgot-password` | Request password reset OTP |
| POST | `/auth/reset-password` | Reset password with OTP |

### Tasks (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (pagination, filter, search) |
| POST | `/tasks` | Create a task |
| GET | `/tasks/:id` | Get a single task |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| PATCH | `/tasks/:id/toggle` | Toggle task completion |

### Profile (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PATCH | `/profile` | Update profile |
| POST | `/profile/upload-picture` | Upload profile picture |

## Setup & Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL

### Backend
```bash
cd backend
npm install
# Create a .env file with:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=your_password
# DB_NAME=task_management
# JWT_ACCESS_SECRET=your_secret
# JWT_REFRESH_SECRET=your_secret
# JWT_ACCESS_EXPIRY=15m
# JWT_REFRESH_EXPIRY=7d
# PORT=3001
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment
- **Backend:** Render (Node.js + PostgreSQL)
- **Frontend:** Vercel
