# StudioSpace Server API (Node.js, Express & MongoDB)
**Assignment Submission:** B14-A8-Cat_Harry  
**Framework Pattern:** Express.js + Native MongoDB Driver (Module 48 Standard)  
**Live API URL:** [https://studiospace-server-akpa.onrender.com](https://studiospace-server-akpa.onrender.com)  
**Database:** MongoDB Atlas (Collection: `studio-assignment-8`)

---

## 🌟 Top 5 Backend Features

1. **Native MongoDB Driver Integration:** Direct connection using the official `mongodb` v6 client to MongoDB Atlas with fast queries and object ID helpers.
2. **Challenge 1 — JWT Authentication & Route Protection:** Secure JWT verification for private routes (`/add-studio`, `/studios/edit/:id`, `/my-listings`, `/bookings`, `/wishlist`).
3. **Challenge 2 — Double-Booking Collision Prevention:** Time interval overlap detection algorithm `(requestedStart < existingEnd && requestedEnd > existingStart)` checking confirmed and pending slots in MongoDB before confirming any reservation.
4. **Complete Studio CRUD Operations:** Clean RESTful routes to create, read, update, delete, search, filter, and fetch featured studios.
5. **Saved Studios Wishlist API:** Direct toggle and retrieval endpoints for user bookmarks stored in the `wishlists` MongoDB collection.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Language** | Node.js, JavaScript (ES6+ Modules) |
| **Server Framework** | Express.js 4.x |
| **Database** | MongoDB Atlas, Native `mongodb` v6 Driver |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Configuration** | `dotenv`, `cors` |
| **Deployment** | Vercel (`vercel.json`) / Render ready |

---

## ⚙️ Local Setup Guide

Follow these simple steps to run the server locally on your computer:

### 1. Open your terminal in the server directory:
```bash
cd server
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Check environment configuration (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/studiospace?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
```

### 4. Start the server:
```bash
npm run dev
# or: node index.js
```
The server will start on [http://localhost:5000](http://localhost:5000).

---

## 🔑 Examiner Test Accounts (Stored in MongoDB Atlas)

| Account Role | Email Address | Password | Capabilities |
|---|---|---|---|
| **Examiner / Creator** | `creator@studiospace.io` | `StudioPassword123` | Book studios, cancel slots, download PDF invoices, save to wishlist |
| **Studio Host** | `alex.director@studiospace.io` | `StudioHost123` | Manage owned listings, edit spaces, delete studios |

---

## 📋 API Route Reference

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Health check endpoint |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | User login & JWT issue |
| `POST` | `/auth/google` | Google social login sync |
| `GET` | `/studios` | Get studios (supports `?category=`, `?search=`, `?maxPrice=`, `?sort=`) |
| `GET` | `/studios/featured` | Get top 6 featured studios |
| `GET` | `/studios/:id` | Get studio details |
| `POST` | `/studios` | Add new studio space (Private) |
| `PUT` | `/studios/:id` | Update studio space (Private) |
| `DELETE` | `/studios/:id` | Delete studio space (Private) |
| `POST` | `/bookings` | Create reservation with double-booking check |
| `GET` | `/bookings/my` | Get current user's bookings |
| `PATCH` | `/bookings/:id/cancel` | Cancel pending booking reservation |
| `GET` | `/wishlist` | Get user saved studios |
| `POST` | `/wishlist/toggle` | Add/remove studio from wishlist |
