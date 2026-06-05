# Expense Vault 💰

A modern **AI-powered Personal Finance Management Application** built with cutting-edge web technologies to help users track expenses, manage budgets, gain intelligent spending insights, and split bills effortlessly with friends.

## 🚀 Live Demo

**Application URL:** https://expense-vault-gold.vercel.app/dashboard

---

## 📖 Overview

Expense Vault is a comprehensive personal finance management platform designed to simplify money management. It enables users to monitor their spending habits, create budgets, receive AI-generated financial recommendations, and manage shared expenses seamlessly.

The application combines intuitive dashboards, real-time data visualization, and artificial intelligence to provide users with actionable financial insights.

---

## ✨ Features

### 💳 Expense Management

* Add, edit, and delete expenses
* Categorize transactions
* Track spending history
* Advanced expense filtering and search

### 📊 Budget Planning

* Create monthly budgets
* Set spending limits by category
* Monitor budget utilization
* Budget performance analytics

### 🤖 AI-Powered Insights

* Personalized spending analysis
* Smart financial recommendations
* Expense pattern detection
* AI-generated budgeting suggestions

### 👥 Bill Splitting

* Split expenses with friends and family
* Track shared payments
* Automated expense calculations
* Notification support for pending settlements

### 🌍 Multi-Currency Support

* Manage expenses in different currencies
* Currency conversion capabilities
* International spending tracking

### ⏰ Reminders & Notifications

* Payment reminders
* Budget alerts
* Expense notifications
* Settlement reminders

### 📈 Interactive Dashboards

* Expense visualization
* Spending trends analysis
* Budget tracking charts
* Financial summary reports

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React 19
* TypeScript
* Tailwind CSS

### Backend & Database

* Prisma ORM
* Next.js Server Actions
* PostgreSQL (via Prisma)

### Authentication

* NextAuth.js

### State Management & Data Fetching

* TanStack Query

### Validation

* Zod

### Artificial Intelligence

* Groq AI

---

## 🏗️ Architecture

Expense Vault follows a modern full-stack architecture:

* **Frontend:** React 19 + Next.js App Router
* **Backend:** Next.js API Routes & Server Actions
* **Database Layer:** Prisma ORM
* **Authentication:** NextAuth.js
* **AI Layer:** Groq AI Integration
* **State Management:** TanStack Query
* **Validation Layer:** Zod

---

## 📸 Key Functionalities

### Expense Tracking

Track daily expenses with categorized transaction management.

### Budget Monitoring

Set budgets and monitor spending behavior in real-time.

### AI Financial Assistant

Receive personalized recommendations based on spending habits.

### Expense Sharing

Split bills among multiple users and track settlements.

### Analytics Dashboard

Visualize financial data through charts and reports.

---

## 📂 Project Structure

```bash
expense-vault/
├── app/
├── components/
├── hooks/
├── lib/
├── prisma/
├── public/
├── services/
├── types/
├── utils/
├── middleware.ts
└── package.json
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/expense-vault.git
cd expense-vault
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GROQ_API_KEY=
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

Application will be available at:

```bash
http://localhost:3000
```

---

## 🎯 Problem Statement

Managing personal finances often requires multiple applications for budgeting, expense tracking, and expense sharing. Expense Vault solves this problem by providing a unified platform where users can:

* Track expenses efficiently
* Manage budgets effectively
* Receive AI-driven financial insights
* Handle shared expenses seamlessly
* Monitor spending patterns through analytics

---

## 📈 Impact

Expense Vault helps users:

* Improve financial awareness
* Reduce unnecessary spending
* Make data-driven financial decisions
* Collaborate on shared expenses
* Maintain budgets more effectively

---

## 🔮 Future Enhancements

* Recurring expense automation
* Investment tracking
* Financial goal management
* Mobile application support
* Bank account integrations
* Advanced AI financial forecasting

---

## 👨‍💻 Author

**Shaswath K. G.**

Full Stack Developer passionate about building scalable web applications and AI-powered solutions.

---

## 📄 License

This project is licensed under the MIT License.
