# 🎓 Placement Drive Scheduler

A full-stack web application designed to help colleges and placement teams efficiently manage and schedule placement activities. The system helps organize companies, students, interviews, placement events, schedules, and related analytics in one centralized platform.

The project focuses on reducing scheduling conflicts and improving the overall placement management process through an automated and structured scheduling system.

---

## 🚀 Features

### 📅 Smart Scheduling
- Create and manage placement week schedules.
- Automatically organize placement activities.
- Reduce scheduling conflicts.
- Manage interview slots and placement events.
- Handle scheduling disruptions and changes.

### 👨‍🎓 Student Management
- Manage student information.
- Track student participation in placement activities.
- Organize students based on relevant criteria.
- Monitor placement-related engagement.

### 🏢 Company Management
- Add and manage participating companies.
- Organize company placement drives.
- Schedule interviews and recruitment activities.
- Track company-related placement events.

### 📊 Dashboard & Analytics
- View placement scheduling information from a centralized dashboard.
- Monitor important placement metrics.
- Analyze scheduling and placement-related data.
- Track overall system performance.

### 🔄 Disruption Management
- Handle unexpected changes in schedules.
- Manage rescheduling requirements.
- Update placement activities efficiently.

### 📉 Churn Analysis
- Track and analyze changes in placement participation.
- Monitor relevant scheduling and engagement metrics.

### 🔐 Authentication
- User registration and login functionality.
- Secure backend API structure.
- Protected routes for authorized access.

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- ESLint

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- dotenv
- CORS

### Tools & Technologies

- Git
- GitHub
- VS Code
- Postman
- MongoDB Atlas

---

## 📁 Project Structure

```text
Placement_Week_Scheduler/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── seedRoutes.js
│   │   ├── scheduleRoutes.js
│   │   ├── metricsRoutes.js
│   │   ├── disruptionRoutes.js
│   │   ├── churnRoutes.js
│   │   └── dashboardRoutes.js
│   │
│   ├── middleware/
│   │
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore