# 🚀 CommunityPulse

**AI-Powered Community Feedback Platform**

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/ohayitsfay/communitypulse)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.2.0-blue)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/mongodb-8.0-green)](https://mongodb.com)

> *"Hear Your Community. Before Problems Escalate."*

---

## 📋 Table of Contents

- [Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🌐 Deployment](#-deployment)
- [🐛 Troubleshooting](#-troubleshooting)
- [👥 Team Members](#-team-members)
- [💬 Inspirational Quotes](#-inspirational-quotes)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## 🎯 Overview

**CommunityPulse** is a comprehensive full-stack web application designed to bridge the communication gap between community leaders and members. 

### The Problem
In many organizations—schools, churches, student groups, nonprofits, and small enterprises—leadership often lacks real-time insight into member sentiment. Dissatisfaction frequently remains silent until it escalates into a critical issue.

### The Solution
CommunityPulse provides:
- 🔐 **Secure anonymous feedback** submission for members
- 🤖 **AI-powered sentiment analysis** using Hugging Face NLP to detect emotional tone
- 📊 **Real-time dashboards** with interactive charts and priority alerts for administrators
- 📈 **Actionable data visualizations** to identify trends and resolve conflicts early

### Project Goal
Demonstrate professional software engineering practices by building a production-ready application that combines modern web development, secure authentication, cloud database management, and machine learning integration.

---

## ✨ Key Features

### 👥 For Members
| Feature | Description |
|---------|-------------|
| 🔐 Anonymous Submission | Share honest feedback without revealing identity |
| 📝 Categorized Feedback | Tag feedback under Facilities, Leadership, Safety, Events, Communication, or Other |
| 👍 Peer Voting | Upvote existing feedback to highlight common concerns |
| 📊 Track Submissions | View status of your submitted feedback (Pending → In Progress → Resolved) |

### 👑 For Administrators
| Feature | Description |
|---------|-------------|
| 📈 Real-Time Dashboard | Visual overview of community mood with sentiment charts, trend lines, and key metrics |
| 🤖 AI Sentiment Analysis | Automatic tagging of messages as Positive, Neutral, or Negative using Hugging Face NLP |
| 🚨 Priority Alerts | Immediate visibility on negative sentiment trends with high upvote counts |
| 📥 Data Export | Download comprehensive reports in CSV or JSON format |
| 👥 User Management | Manage member accounts, roles (member/moderator/admin), and permissions |
| 📋 Issue Tracking | Update feedback status with admin notes and resolution workflows |

### 🔒 Security & Performance
| Feature | Implementation |
|---------|---------------|
| 🔐 JWT Authentication | Secure token-based auth with HTTP-only cookies |
| 🛡️ Rate Limiting | Express-rate-limit middleware prevents API abuse |
| 🔐 Password Security | bcrypt hashing with salt rounds + input validation |
| 📱 Responsive Design | Mobile-first Tailwind CSS, works on all devices |
| 📝 Audit Logging | Track admin actions for accountability |
| 🌐 CORS & Helmet | Secure HTTP headers and cross-origin configuration |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2+ | Component-based UI library |
| React Router | 6.22+ | Client-side routing and navigation |
| Vite | 5.1+ | Fast build tool and dev server |
| Tailwind CSS | 3.4+ | Utility-first CSS framework |
| Axios | 1.6+ | HTTP client for API communication |
| Recharts | 2.12+ | Declarative charts and data visualization |
| Lucide React | 0.34+ | Beautiful, consistent icon library |
| React Hot Toast | 2.4+ | Elegant toast notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | JavaScript runtime environment |
| Express.js | 4.18+ | Minimal web framework |
| MongoDB | 8.0+ | NoSQL document database |
| Mongoose | 8.2+ | ODM for MongoDB schema management |
| JSON Web Tokens | 9.0+ | Stateless authentication |
| bcryptjs | 2.4+ | Secure password hashing |
| Hugging Face Inference | 2.6+ | AI sentiment analysis API |
| express-validator | 7.0+ | Request validation and sanitization |
| express-rate-limit | 7.2+ | API rate limiting middleware |
| helmet | 7.1+ | Security headers middleware |
| cors | 2.8+ | Cross-origin resource sharing |

### DevOps & Tools
| Tool | Purpose |
|------|---------|
| Git & GitHub | Version control and collaboration |
| Render.com | Backend hosting with auto-deploy |
| Vercel/Netlify | Frontend static hosting |
| MongoDB Atlas | Cloud-managed MongoDB cluster |
| ESLint + Prettier | Code quality and formatting |
| dotenv | Environment variable management |

---

## 📁 Project Structure
community-pulse-byu/<br>
├── client/ # React Frontend (Vite)<br>
│ ├── public/<br>
│ │ ├── vite.svg<br>
│ │ └── _redirects # SPA routing for Netlify/Vercel<br>
│ ├── src/<br>
│ │ ├── components/<br>
│ │ │ ├── ui/ # Reusable UI components<br>
│ │ │ │ ├── Button.jsx<br>
│ │ │ │ ├── Card.jsx<br>
│ │ │ │ ├── Badge.jsx<br>
│ │ │ │ └── LoadingSpinner.jsx<br>
│ │ │ └── layout/<br>
│ │ │ ├── Header.jsx<br>
│ │ │ └── ProtectedRoute.jsx<br>
│ │ ├── context/<br>
│ │ │ └── AuthContext.jsx<br>
│ │ ├── pages/<br>
│ │ │ ├── LandingPage.jsx<br>
│ │ │ ├── Login.jsx<br>
│ │ │ ├── Register.jsx<br>
│ │ │ ├── Dashboard.jsx<br>
│ │ │ ├── FeedbackBrowser.jsx<br>
│ │ │ ├── SubmitFeedback.jsx<br>
│ │ │ ├── Profile.jsx<br>
│ │ │ └── AdminPanel.jsx<br>
│ │ ├── services/<br>
│ │ │ ├── api.js<br>
│ │ │ ├── authService.js<br>
│ │ │ ├── feedbackService.js<br>
│ │ │ └── analyticsService.js<br>
│ │ ├── utils/<br>
│ │ │ ├── constants.js<br>
│ │ │ └── helpers.js<br>
│ │ ├── App.jsx<br>
│ │ ├── main.jsx<br>
│ │ └── index.css<br>
│ ├── index.html<br>
│ ├── package.json<br>
│ ├── vite.config.js<br>
│ ├── tailwind.config.js<br>
│ ├── postcss.config.js<br>
│ └── .env<br>
│<br>
├── server/ # Node.js Backend (Express)<br>
│ ├── config/<br>
│ │ ├── db.js # MongoDB connection<br>
│ │ └── hf-api.js # Hugging Face API client<br>
│ ├── controllers/<br>
│ │ ├── authController.js<br>
│ │ ├── feedbackController.js<br>
│ │ └── analyticsController.js<br>
│ ├── middleware/<br>
│ │ ├── auth.js # JWT authentication<br>
│ │ ├── validate.js # Request validation<br>
│ │ ├── errorHandler.js # Global error handler<br>
│ │ └── rateLimit.js # API rate limiting<br>
│ ├── models/<br>
│ │ ├── User.js<br>
│ │ ├── Feedback.js<br>
│ │ └── AuditLog.js<br>
│ ├── routes/<br>
│ │ ├── authRoutes.js<br>
│ │ ├── feedbackRoutes.js<br>
│ │ └── analyticsRoutes.js<br>
│ ├── scripts/<br>
│ │ └── seedData.js # Database seeder<br>
│ ├── utils/<br>
│ │ └── sentimentAnalyzer.js<br>
│ ├── server.js # Express entry point<br>
│ ├── package.json<br>
│ ├── .env.example<br>
│ └── render.yaml # Render.com deployment config<br>
│
├── .gitignore<br>
├── README.md<br>
└── LICENSE<br>


👥 Team Members

Name	         Role	                                    GitHub
Favourite Atuhu	 Full-Stack Developer(QA & Documentation  )	@ohayitsfay
Olubisi Ayantoye Full-Stack Developer    	                 -
Adedeji Usman	 Frontend Developer	                          -
Azeez Daniel	 Backend Developer	                          -
John Idorot	     DevOps & Database	                           -

