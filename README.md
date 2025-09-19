# Real-time Proctoring Application

This project is a **real-time video proctoring system** designed to ensure the integrity of online exams and interviews.  

The application performs a dual function:  
- Detects whether a candidate is focused on the screen.  
- Flags the presence of any unauthorized items (cell phones, notes, books, etc.) in the video feed.  

By combining client-side video analysis with a backend reporting system, it provides a **comprehensive solution** for monitoring candidate behavior and generating detailed reports.

---

## 🚀 Technology Stack

### Frontend
- **React**: JavaScript library for building user interfaces  
- **Vite**: Fast build tool for modern web development  
- **TypeScript**: Typed superset of JavaScript  
- **Tailwind CSS**: Utility-first CSS framework for styling  

### Backend
- **Node.js & Express**: Minimalist web framework for the server  
- **TypeScript**: Ensures type safety and improves code quality  
- **MySQL**: Relational database for storing proctoring reports  

### Detection Libraries
The core detection logic runs **client-side within a web worker** for smooth performance.  

- **Face Detection**: [OpenCV.js](https://opencv.org/) with pre-trained Haar Cascade classifier  
- **Object Detection**: [TensorFlow.js](https://www.tensorflow.org/js) with COCO-SSD model  

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:  

- [Node.js (LTS version)](https://nodejs.org/)  
- npm (or yarn)  
- MySQL Server (local or remote)  

---

## ⚙️ Installation & Setup

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and set up your environment variables.

```bash
cd backend
npm install
### Create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=proctoring

```
---

### 2. Database Setup

The backend includes a db.ts file that automatically creates the proctoring_reports table if it does not exist.

Ensure your MySQL server is running and accessible using the credentials provided in .env.

The server will handle the table creation on startup.

### 3. Frontend Setup

In a new terminal, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

## ▶️ Usage


### 1. Start the Backend Server

From the backend directory:

```bash
npm start
```

The server will start on port 3001 (or your configured port).

### 2. Start the Frontend Application

From the frontend directory:

```bash
npm run dev
```

The application will be accessible at:
👉 http://localhost:5173

### 3. Using the Application

- Open the application in your browser.

- Click "Start Interview" to begin the proctoring session and grant camera access.

- The app will analyze your video feed in real-time and log detected events.

- Once the session is complete, click "Stop Interview" to generate and view a final report.
