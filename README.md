
# 🚀 Engineering Resource Management System

A full-stack web application to manage engineers, projects, and assignments with dashboards, capacity tracking, and role-based access control.

> ✅ Built as part of a technical assignment.  
> 🧠 Used AI tools (Cursor AI + ChatGPT) throughout development to accelerate and improve code quality.

---

## 📌 Overview

The goal of this app is to streamline engineering project planning by helping managers:

- Assign engineers based on skill and availability.
- Visualize engineer workload and availability.
- Track project statuses and resource allocation.
- Offer engineers a dashboard to see their upcoming and current assignments.

This system supports **two roles**: `Manager` and `Engineer`.

---

## 🎯 Core Features

- 🔐 **Auth & Role-Based Access**
  - JWT login
  - Protected routes
  - Role-based UI (Manager vs Engineer)

- 👩‍💻 **Engineer Management**
  - Profile with skills, seniority, department
  - Full-time or part-time capacity tracking

- 📁 **Project Management**
  - Define required skills
  - Track project phase (Planning, Active, Completed)

- 🔄 **Assignments**
  - Assign engineers to projects
  - Define role, allocation %, and duration
  - Auto-update engineer availability

- 📊 **Dashboards**
  - Manager: Overview of team, search/filter by skills
  - Engineer: My Projects & Workload

- 📈 **Analytics & Charts**
  - Utilization overview
  - Timeline & availability view
  - Skill gap analysis (bonus feature!)

---

## 🧠 How I Used AI Tools

> AI tools made a huge difference in speed, structure, and debugging!

- **Cursor AI :**
  - Used throughout the project to scaffold backend routes, React components, context files, and even write MongoDB queries.
  - Helped me stay in flow with autocomplete for common patterns like error handling, middleware structure, and hooks.

- **ChatGPT:**
  - Used for:
    - Debugging errors (TypeScript, CORS, async issues).
    - Understanding TypeScript type errors and designing better interfaces.
    - Writing parts of this README 😅.
    - Brainstorming dashboard UI and capacity tracking logic.
    - Optimizing JSON seed data and project flow.

---

## 🧱 Tech Stack

### 🔙 Backend

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- CORS, Helmet, Morgan
- Custom Auth & Error Middlewares
- REST API Architecture

### 🔜 Frontend

- React (Vite)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Chart.js
- Lucide Icons
- React Context (for Auth & Data)
- Role-based rendering

---

## 🗂 Folder Structure

> Repo split into frontend and backend for modular deployment.

```
📁 backend/
├── models/
├── routes/
├── controllers/
├── middlewares/
└── utils/

📁 frontend/
├── src/api/
├── src/components/
├── src/layouts/
├── src/pages/
├── src/context/
└── src/lib/
```

---

## 🔐 Authentication

- Login via `/api/v1/auth/login`
- Profile fetch via `/api/v1/auth/profile`
- JWT stored in localStorage (for simplicity)
- Protected frontend routes based on user role

---

## 🛠 Database Schema

### 👤 User

```js
{
  name,
  email,
  role: "manager" | "engineer",
  skills: [String],
  seniority: "junior" | "mid" | "senior",
  maxCapacity: 100 | 50,
  department
}
```

### 📁 Project

```js
{
  name,
  description,
  startDate,
  endDate,
  requiredSkills: [String],
  teamSize,
  status: "planning" | "active" | "completed",
  managerId
}
```

### 🔄 Assignment

```js
{
  engineerId,
  projectId,
  allocationPercentage,
  startDate,
  endDate,
  role
}
```


---

## 📡 API Routes

### 🔐 Auth
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/profile`

### 👨‍💻 Engineers
- `GET /api/v1/engineers`
  - `GET /api/v1/engineers?skills=React,Node.js`
- `GET /api/v1/engineers/:id/capacity`
- `GET /api/v1/engineers/:id/availability`
  - returns when an engineer will be available for new projects

### 🧱 Projects
- `GET /api/v1/projects`
  - `GET /api/v1/project?status=active`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `GET /api/v1/projects/:id/suitable-engineers`
  - returns engineers matching project's required skills

### 📎 Assignments
- `GET /api/v1/assignments`
- `POST /api/v1/assignments`
- `PUT /api/v1/assignments/:id`
- `DELETE /api/v1/assignments/:id`

### 📊 Analytics
- `GET /api/v1/analytics/utilization`
  - returns stats on allocation, under/over-utilized engineers
- `GET /api/v1/assignments/timeline`
  - returns assignments with start/end dates for calendar view

---

## 🎨 UI Highlights

- ⚡ Tailwind-based responsive layout
- 🧠 ShadCN UI for polished design
- 📊 Chart.js for team utilization charts
- 🧩 Visual capacity bars for engineers
- 🏷 Skill tags, project filters, and availability cards
- 🗓 Assignment timeline view




---

## 🌐 Deployment

- Frontend and Backend deployed on **Vercel**

---

## 📎 Links

- 🔗 **Frontend GitHub**: https://github.com/SherlockValer/Assignly
- 🔗 **Backend GitHub**: https://github.com/SherlockValer/Assignly-API
- 🚀 **Live Demo**: https://assignly-app.vercel.app/

---

## 🙋‍♂️ About Me

Hi, I'm Vaibhav Chopde!  
This project was both fun and challenging — I learned a lot about planning data structures, implementing business logic, and ensuring usable UI/UX.

Thanks for reviewing! 😄  
Feel free to contact me for improvements or feedback.

---




## ✅ Completed Task List

### 📦 Core Features

- [x]  **Authentication & User Roles**
    - [x]  Login system with two roles: Manager and Engineer
    - [x]  Engineers can view their assignments
    - [x]  Managers can assign people to projects
- [x]  **Engineer Management**
    - [x]  Engineer Profile: Name, skills (React, Node.js, Python, etc.), seniority level
    - [x]  Employment Type: Full-time (100% capacity) or Part-time (50% capacity)
    - [x]  Current Status: Available percentage (e.g., 60% allocated, 40% available)
- [x]  **Project Management**
    - [x]  Basic Project Info: Name, description, start/end dates, required team size
    - [x]  Required Skills: What technologies/skills the project needs
    Project Status: Active, Planning, Completed
- [x]  **Assignment System**
    - [x]  Assign Engineers to Projects: Select engineer, project, allocation percentage
    - [x]  View Current Assignments: Who's working on which project and for how long
    - [x]  Capacity Tracking: Visual indicator of each engineer's current workload
- [x]  **Dashboard Views**
    - [x]  Manager Dashboard: Team overview, who's overloaded/underutilized
    - [x]  Engineer Dashboard: My current projects and upcoming assignments
    - [x]  Availability Planning: When will engineers be free for new projects
- [x]  **Search & Analytics**
    - [x]  Search & Filter: Find engineers by skills or projects by status
    - [x]  Analytics: Simple charts showing team utilization

### 🛠 Technical Implementation

- [x]  **Frontend (React (vite) + TypeScript)**
    - [x]  Components: Use ShadCN UI components with Tailwind CSS
    - [ ]  Forms: React Hook Form for project/assignment creation
    - [x]  Data Display: Tables showing assignments, charts showing capacity
    - [x]  State Management: React Context

- [x]  **Backend (Node.js)**
    - [x]  Database: MongoDB
    - [x]  Authentication: JWT tokens
    - [x]  API Design: RESTful endpoints
    - [x]  Business Logic: Capacity calculations

### 📊 UI & UX
- [x]  **Manager Pages**
    - [x]  Team Overview: List of engineers with current capacity (e.g., "John: 80% allocated")
    - [x]  Create Assignment: Form to assign engineer to project with percentage
    - [x]  Project Management: Create/edit projects with required skills

- [x]  **Engineer Pages**
    - [x]  My Assignments: Current and upcoming projects
    - [x]  Profile: Update skills and basic info

- [x]  Key UI Elements
    - [x]  Capacity Bars: Visual representation of workload (progress bars)
    - [x]  Skill Tags: Display engineer skills and project requirements
    - [x]  Assignment Timeline: Simple calendar view of assignments



