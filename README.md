# StudioSpace Server (Express.js & MongoDB)

> High-performance RESTful API backend for **StudioSpace** — Peer-to-Peer Creative Workspace & Production Studio Sharing Platform. Built cleanly with Node.js, Express.js, MongoDB, Mongoose, and JWT authentication.

## 🚀 Overview

StudioSpace backend powers creative workspace listings, reservations, double-booking prevention, wishlists, and user authentication with HTTPOnly cookie security. Written in clean, readable, comfortable JavaScript that is easy to follow and maintain.

## 🛠 Tech Stack

- **Runtime & Language:** Node.js, JavaScript (ES6+ / CommonJS)
- **Web Framework:** Express.js 4.x
- **Database & ODM:** MongoDB, Mongoose 8.x
- **Authentication & Security:** JSON Web Tokens (JWT) stored in HTTPOnly cookies, bcryptjs password hashing
- **Development Tooling:** Dotenv, CORS, Cookie-Parser, Nodemon / native Node watch

## 🌟 Key Features & Challenges

1. **Challenge 1 (JWT Security with HTTPOnly Cookies):**
   - Protected server-side mutations (`POST /api/studios`, `DELETE /api/studios/:id`, `POST /api/bookings`).
   - Secure token storage in HTTPOnly cookies with fallback to `Authorization: Bearer` header.
   - 401 Unauthorized rejection for tampering or missing tokens.

2. **Challenge 2 (Double-Booking Prevention):**
   - Time interval overlap detection `(requestedStart < existingEnd && requestedEnd > existingStart)` against existing `Confirmed` & `Pending` bookings in MongoDB for the exact studio workspace and date.
   - Rejects slot collisions with `409 Conflict` and descriptive availability feedback.

3. **Role & Ownership Authorization:**
   - Strict owner checks for studio listing modifications and deletions.
   - Host and creator specific booking management routes.

4. **Saved Studios Wishlist (MongoDB):**
   - Compound index uniqueness `(userEmail, studioId)` preventing duplicate bookmarks.
   - Real-time save status checking.

5. **Self-Healing Auto-Seed:**
   - Automatically populates the database on first boot with 6+ ultra-realistic creative spaces (cyc walls, soundstages, podcast rooms, audio suites, artisan workshops).
   - Pre-seeds test examiner accounts.

---

## 📋 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user with password validation | No |
| POST | `/api/auth/login` | Login user, set HTTPOnly cookie & return JWT | No |
| POST | `/api/auth/google` | Google OAuth profile sync / login | No |
| GET | `/api/auth/me` | Fetch currently authenticated user | Yes |
| POST | `/api/auth/logout` | Clear HTTPOnly cookie | No |

### Studios (`/api/studios`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/studios` | Filter & search studios (category, price, sort) | No |
| GET | `/api/studios/featured` | Top 6 rated studios (`.limit(6)`) | No |
| GET | `/api/studios/:id` | Studio details by ID | No |
| GET | `/api/studios/user/:email`| User-owned studio listings | Yes |
| POST | `/api/studios` | Create new studio listing | Yes |
| PUT | `/api/studios/:id` | Update studio (owner only) | Yes |
| DELETE | `/api/studios/:id` | Delete studio (owner only) | Yes |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/bookings` | Book studio with double-booking prevention | Yes |
| GET | `/api/bookings/my` | User's creative bookings | Yes |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking | Yes |
| PATCH | `/api/bookings/:id/status` | Update booking status (Pending, Confirmed, etc.) | Yes |

### Wishlist (`/api/wishlist`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/wishlist/toggle` | Save/unsave studio | Yes |
| GET | `/api/wishlist` | Get user's saved studios list | Yes |
| GET | `/api/wishlist/ids` | Get array of saved studio IDs | Yes |

---

## ⚙️ Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <server-repo-url>
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Provide your MongoDB connection URI:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/studiospace?retryWrites=true&w=majority
   JWT_SECRET=studiospace_secure_jwt_secret_token_987654321
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Seed Database (Optional - also auto-runs on first boot):**
   ```bash
   npm run seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 🔑 Examiner Test Credentials

- **Examiner Creator Account:**
  - **Email:** `creator@studiospace.io`
  - **Password:** `StudioPassword123`
- **Host Account:**
  - **Email:** `alex.director@studiospace.io`
  - **Password:** `StudioHost123`
