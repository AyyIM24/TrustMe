# TrustMe AI — MySQL Database Documentation & Setup Guide

This project uses **MySQL** as its primary relational database for authentication, biometric face signatures, clinical veracity analysis history, feedback loops, and trending healthcare topics.

---

## 1. Quick Start

### Step 1: Ensure MySQL Server is Running
Make sure MySQL Server (v8.0+ or v9.0+) or MariaDB (v10.4+) is running locally on port `3306` (e.g. via MySQL Workbench, Windows Services, XAMPP, or Docker).

### Step 2: Configure `.env`
In `backend/.env`, set your database connection string:
```ini
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/trustme_db
```
*(Note: If your password contains special characters like `@`, URL-encode them, e.g. `@` becomes `%40`)*

### Step 3: Initialize Database & Tables
Run the automated setup utility from the project root or `backend/`:
```bash
python backend/init_db.py
```
This script will:
1. Automatically connect to MySQL and execute `CREATE DATABASE IF NOT EXISTS trustme_db`.
2. Create all 6 relational tables with indexes and foreign key constraints via SQLAlchemy.
3. Seed a default demo user (`demo_user` / `Password123!`).
4. Seed initial healthcare trending topics.

### Step 4: Validate Connection & Table Status
Run the health check utility anytime:
```bash
python backend/check_db.py
```

---

## 2. Table Schema Overview

| Table | Description |
|---|---|
| `users` | User accounts, hashed passwords, roles (`user`, `analyst`, `admin`), active status, avatar, and last login. |
| `user_faces` | 1-to-1 biometric face feature vectors linked to `users.id` with `ON DELETE CASCADE`. |
| `analyses` | Complete history of text and URL veracity analyses, ML predictions, confidence scores, credibility indexes, and word counts. |
| `feedback` | Human-in-the-loop analyst feedback on veracity predictions for continuous model fine-tuning. |
| `trending_topics` | Aggregated clinical disinformation keyword counters (`fake_count` vs `real_count`). |
| `bulk_jobs` | Tracking asynchronous batch analysis jobs and output artifact paths. |

---

## 3. Manual SQL Import (Alternative)

If you prefer to import raw SQL through **MySQL Workbench**, **phpMyAdmin**, or the **MySQL Command Line**, use the included schema file:

```bash
mysql -u root -p < database/trustme_schema.sql
```
or open `database/trustme_schema.sql` directly in MySQL Workbench and execute it.

---

## 4. Automatic Startup Synchronization
Whenever you start the FastAPI backend server:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
The application lifecycle (`lifespan`) automatically checks MySQL connection health and runs `Base.metadata.create_all(bind=engine)`, ensuring all tables are verified and up-to-date seamlessly.
