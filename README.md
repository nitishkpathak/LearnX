# 🎓 LearnX | Premium Full-Stack Learning Management System

[![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://nitishkpathak.github.io/LearnX/frontend/)
[![Render](https://img.shields.io/badge/Backend-Render-darkgreen?style=for-the-badge&logo=render)](https://learnx-backend-wygd.onrender.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-emerald?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

LearnX is a state-of-the-art, responsive, and gamified **Learning Management System (LMS)** designed to provide students with a premium educational workspace. The application integrates a modern glassmorphic landing page with an interactive student dashboard, featuring real-time course player progression, MCQ quizzes, assignment submission tracking, XP-based leaderboards, and automated email alerts.

---

## 🚀 Live Demo

- **Frontend (Hosted on GitHub Pages):** [https://nitishkpathak.github.io/LearnX/frontend/](https://nitishkpathak.github.io/LearnX/frontend/)
- **Backend API (Hosted on Render):** [https://learnx-backend-wygd.onrender.com](https://learnx-backend-wygd.onrender.com)

---

## ✨ Features

### 🌟 Premium Landing Page (`/frontend`)
- **Aesthetic Glassmorphism:** Sleek, modern styling with dark/light mode toggle.
- **Dynamic Course Catalog:** Categorized course display with custom search and real-time category filtering.
- **Wishlist Integration:** Interactive wishlist toggle saves/removes items with responsive alerts.
- **Smart Auth Triggers:** Non-logged-in users clicking premium resources are greeted with custom **SweetAlert2** login modals.

### 📊 Gamified Student Workspace (`/frontend/dashboard.html`)
- **Dynamic Stats Grid:** Tracks enrolled courses count, completed assignments, and overall learning progress.
- **Course Player:** HTML5 native video player with interactive syllabus navigation, play/pause controls, and video playlists tailored to course subjects.
- **MCQ Practice Quizzes:** progression-locked lectures. Students must pass a quiz (100% score) to unlock the next video chapter and update progress.
- **Assignment Submissions:** Submit project links (e.g. GitHub repositories) and comments directly to the backend.
- **Achievements Badges Grid:** Showcases earned milestones (e.g. "First Steps", "JS Wizard", "HTML Master", "Active Learner") with vibrant status effects, and grayscaled lock icons for pending badges.
- **Top Students Leaderboard:** Ranks top 10 students globally by XP with crowns for podium spots and custom highlights for the active student's position.
- **One-Click PDF Certificates:** Reaching 100% progress in any course unlocks an elegant certificate. Download it instantly as a high-resolution landscape PDF (built using `html2canvas` + `jsPDF`).
- **Profile Customization:** Crop/compress profile picture uploads to base64, keeping database footprints under `30KB` and preventing network timeouts.

### ⚙️ Backend API (`/backend`)
- **JWT Authentication:** Password hashing using `bcryptjs` and session tokens using `jsonwebtoken`.
- **Auto-Enrollment Sync:** Automatically enrolls new signups in default courses, and retroactively syncs old accounts on dashboard load so they immediately have all 11 default courses.
- **Nodemailer Alerts:** Dispatches beautiful HTML email templates for:
  - **Welcome Email:** Sent upon student registration.
  - **Assignment Submitted:** Confirms project uploads.
  - **Course Completion:** Celebrates finishing a course and prompts certificate downloads.
  - *Fallback Server:* Automatically creates an Ethereal SMTP sandbox account if no SMTP configurations are set in `.env` for easy testing.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Custom Variables, Alternating Sectioning, Dark-Theme Engine), JavaScript (ES6+), Bootstrap 5, SweetAlert2, FontAwesome 6, html2canvas, jsPDF |
| **Backend** | Node.js, Express, Nodemailer |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), BcryptJS |
| **Deployment** | GitHub Pages (Static Frontend), Render (Cloud Backend Web Service) |

---

## 📂 Project Structure

```
LearnX-main/
├── backend/                  # Node.js + Express Backend Server
│   ├── middleware/           # JWT Authentication Middleware
│   ├── models/               # MongoDB Mongoose Schemas (User, Course)
│   ├── routes/               # API Routes (auth, dashboard, contact)
│   ├── utils/                # Utility modules (Nodemailer dispatcher)
│   ├── .env.example          # Environment variables template
│   ├── server.js             # Server entry point
│   └── package.json          # Node dependencies
├── frontend/                 # Static Frontend Application
│   ├── assets/
│   │   ├── css/              # stylesheet modules (index, dashboard, dark-theme, navbar)
│   │   ├── images/           # branding assets, badges, and logos
│   │   └── js/               # client-side controller logic (router, dashboard, auth-modal, theme)
│   ├── index.html            # Landing page index view
│   ├── dashboard.html        # Student Workspace dashboard view
│   └── manifest.json         # PWA Manifest configuration
└── README.md                 # Root documentation
```

---

## ⚙️ Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster connection string

### 1. Clone the Repository
```bash
git clone https://github.com/nitishkpathak/LearnX.git
cd LearnX
```

### 2. Configure Backend Environment
Navigate to the `backend` folder and create a `.env` file:
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in your credentials:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/learnx
JWT_SECRET=your_super_secret_jwt_key

# Optional: Email SMTP settings (If omitted, server uses Ethereal fallback engine)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Install Dependencies & Start Server
```bash
# Install backend dependencies
npm install

# Start development server (using nodemon)
npm run dev
```
The server will boot up on `http://localhost:5000` and output:
```
✅ DB Connected
Server running on port 5000
```

### 4. Running the Frontend
The backend is pre-configured to serve the `frontend` folder statically on the same origin (`http://localhost:5000`).
1. Simply navigate to `http://localhost:5000/index.html` in your web browser.
2. Alternatively, double-click `frontend/index.html` on your desktop. The client-side router is smart enough to detect the `file:` protocol and route API calls back to `http://localhost:5000` seamlessly.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
