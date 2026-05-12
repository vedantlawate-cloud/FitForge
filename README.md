# 🏋️ FitForge — Advanced Fitness Tracking Dashboard

> A full-stack fitness tracking web application with calorie tracking, workout logging, lift PRs, diet routines, and more.

![FitForge Banner](./frontend/assets/banner-placeholder.png)

---

## 🚀 Features

- **Dashboard** — Daily summary with calories, macros, steps, water intake
- **Calorie Tracker** — Log meals, search foods, track macros (protein/carbs/fat)
- **Workout Routine** — Create & manage workout plans with sets/reps/rest
- **Lift Tracker** — Track PRs (Personal Records) and progression charts
- **Diet Routine** — Weekly meal plans and diet schedules
- **Profile Page** — Avatar, stats, goals, body measurements
- **Settings** — Account preferences, theme, notifications, units

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (SPA) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Charts | Chart.js |
| Animations | CSS Keyframes + Intersection Observer |

---

## 📁 Project Structure

```
fitforge/
├── frontend/
│   ├── index.html          # Single Page App shell
│   ├── css/
│   │   ├── main.css        # Global styles, variables, layout
│   │   ├── components.css  # Reusable UI components
│   │   ├── animations.css  # All animations & transitions
│   │   └── sections/       # Per-section styles
│   ├── js/
│   │   ├── app.js          # SPA router & init
│   │   ├── api.js          # API client (fetch wrapper)
│   │   ├── auth.js         # Login/register logic
│   │   ├── dashboard.js    # Dashboard section
│   │   ├── calories.js     # Calorie tracker
│   │   ├── workout.js      # Workout routines
│   │   ├── lifts.js        # Lift tracker / PRs
│   │   ├── diet.js         # Diet routine
│   │   ├── profile.js      # Profile page
│   │   └── settings.js     # Settings
│   └── assets/
│       └── icons/
├── backend/
│   ├── server.js           # Express entry point
│   ├── config/
│   │   └── db.js           # PostgreSQL connection pool
│   ├── db/
│   │   ├── schema.sql      # Full DB schema
│   │   └── seed.sql        # Sample seed data
│   ├── middleware/
│   │   ├── auth.js         # JWT verification middleware
│   │   └── validate.js     # Request validation
│   ├── models/             # DB query functions
│   ├── controllers/        # Business logic
│   ├── routes/             # Express routes
│   └── .env.example        # Environment variables template
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/fitforge.git
cd fitforge
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials
```

### 4. Initialize the database
```bash
psql -U postgres -c "CREATE DATABASE fitforge;"
psql -U postgres -d fitforge -f backend/db/schema.sql
psql -U postgres -d fitforge -f backend/db/seed.sql   # optional
```

### 5. Start the server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

### 6. Open in browser
```
http://localhost:3000
```

---

## 🔑 Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitforge
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 📸 Screenshots

> Add screenshots here once deployed

---

## 🛣️ Roadmap

- [ ] Mobile responsive PWA
- [ ] Barcode food scanner
- [ ] AI-powered meal suggestions
- [ ] Social features (share workouts)
- [ ] Wearable integration (Fitbit, Apple Watch)
- [ ] Export data to CSV/PDF

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT © 2024 FitForge
