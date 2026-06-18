# ⚙️ LearnX | Backend REST API

This directory contains the Node.js + Express backend server for the LearnX LMS workspace, connecting with MongoDB Atlas via Mongoose ODM.

## 🚀 Quick Links
- **Live Server URL:** [https://learnx-backend-wygd.onrender.com](https://learnx-backend-wygd.onrender.com)
- **Main Documentation:** Please refer to the [Root README.md](../README.md) for local setup instructions.

## 🛠️ Technology Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB Atlas + Mongoose
- **Securities:** JWT, BcryptJS, CORS
- **Email:** Nodemailer (with Ethereal SMTP sandbox fallback)

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
* `POST /signup`: Registers a new user, hashes password, saves default course enrollment schemas, and triggers welcome emails.
* `POST /login`: Validates user credentials and returns a signed session JWT token.
* `POST /forgot-password`: Stub endpoint for dispatching password recovery links.

### 📊 Dashboard & Student Workspace (`/api/dashboard`)
* `GET /data`: Fetches all user stats, profile data, enrolled courses, and assignments. Retroactively runs auto-enrollment for new courses.
* `PUT /profile`: Updates user metadata (name, email, and base64 profile photo).
* `POST /enroll`: Enrolls the student in a new course.
* `PUT /course/:id/progress`: Updates learning progress for a specific course (0-100%) and handles XP reward calculation (+50 XP per lesson) and badge unlock events.
* `PUT /assignment/:id`: Saves assignment submissions (comment notes, GitHub URLs) and awards +150 XP.
* `GET /leaderboard`: Computes overall student XP rankings and returns the top 10 ranked learners.
* `POST /reset`: Resets all student learning progress, settings, and badges back to system defaults.
