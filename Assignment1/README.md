# Felicity Event Management System

A comprehensive event management platform built with the MERN stack for managing events, registrations, and participants for the Felicity fest.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [Core Features](#core-features)
- [Advanced Features](#advanced-features)
- [Libraries & Frameworks](#libraries--frameworks)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## ✨ Features

### Part 1: Core System (70 Marks)

#### Authentication & Security (8 Marks)
- **JWT-based authentication** with secure token management
- **bcrypt password hashing** for secure storage
- **Role-based access control** (Participant, Organizer, Admin)
- **IIIT email validation** for IIIT participants
- **Session persistence** across browser restarts
- **Password reset functionality**

#### User Management
- **Three distinct roles:** Participant, Organizer, Admin
- **Participant registration** with IIIT and Non-IIIT options
- **Admin-provisioned organizer accounts** with auto-generated credentials
- **User onboarding** with interests and club following
- **Profile management** with editable fields

#### Event System
- **Two event types:** Normal Events and Merchandise Events
- **Event creation and management** (Draft → Published → Ongoing → Completed)
- **Dynamic custom registration forms** with multiple field types
- **Registration validation** (eligibility, deadlines, limits)
- **Event search and filtering** (fuzzy search, trending, filters)
- **Event tags and categorization**

#### Registration & Ticketing
- **Automated ticket generation** with unique ticket IDs
- **QR code generation** for event check-in
- **Email notifications** with ticket and QR code
- **Registration status tracking**
- **Participation history** management

#### Dashboard & Analytics
- **Participant dashboard** with upcoming/completed/cancelled events
- **Organizer dashboard** with event analytics and revenue tracking
- **Admin dashboard** with system-wide statistics
- **Event-specific analytics** (registrations, attendance, revenue)

### Part 2: Advanced Features (30 Marks)

**Selected Features:**

#### Tier A Features (8 marks each)
*(Implementation recommendations - choose 2)*

1. **Hackathon Team Registration**
   - Team leader creates team with size limits
   - Unique invite code/link generation
   - Team member acceptance tracking
   - Registration completes when team is full
   - Team management dashboard

2. **Merchandise Payment Approval Workflow**
   - Payment proof upload by users
   - Pending approval state
   - Organizer approval/rejection interface
   - Stock decrement on approval
   - Ticket generation after approval

3. **QR Scanner & Attendance Tracking**
   - Built-in QR scanner using device camera
   - Attendance marking with timestamp
   - Duplicate scan prevention
   - Live attendance dashboard
   - CSV export of attendance
   - Manual override with audit logging

#### Tier B Features (6 marks each)
*(Implementation recommendations - choose 2)*

1. **Real-Time Discussion Forum**
   - Event-specific discussion threads
   - Real-time messaging
   - Organizer moderation capabilities
   - Message reactions and threading
   - Notification system

2. **Organizer Password Reset Workflow**
   - Password reset request system
   - Admin approval interface
   - Auto-generated new passwords
   - Request status tracking
   - Reset history

3. **Team Chat**
   - Real-time team communication
   - Message history
   - Online status indicators
   - Typing indicators
   - File sharing

#### Tier C Features (2 marks each)
*(Implementation recommendations - choose 1)*

1. **Anonymous Feedback System**
   - Star ratings (1-5)
   - Text comments
   - Aggregated ratings display
   - Filter by rating

2. **Add to Calendar Integration**
   - .ics file generation
   - Google Calendar integration
   - Microsoft Outlook integration
   - Universal calendar import

3. **Bot Protection**
   - Google reCAPTCHA v2/v3 integration
   - hCaptcha support
   - Login/registration protection

## 🛠 Technology Stack

### Backend
- **Node.js** (v18+) - JavaScript runtime
- **Express.js** (v4.18) - Web application framework  
- **MongoDB** (v8.0) - NoSQL database via Mongoose
- **JWT** (jsonwebtoken v9.0) - Authentication tokens
- **bcryptjs** (v2.4) - Password hashing
- **Nodemailer** (v6.9) - Email service integration
- **QRCode** (v1.5) - QR code generation
- **Multer** (v1.4) - File upload handling

### Frontend
- **React** (v18.2) - UI library
- **React Router DOM** (v6.20) - Client-side routing
- **Vite** (v5.0) - Build tool and dev server
- **Axios** (v1.6) - HTTP client
- **React Toastify** (v9.1) - Toast notifications

### Development Tools
- **Nodemon** - Auto-restart during development
- **dotenv** - Environment variable management

## 📁 Project Structure

```
Assignment1/
├── backend/
│   ├── models/
│   │   ├── User.js           # User model (Participant/Organizer/Admin)
│   │   ├── Event.js          # Event model
│   │   └── Registration.js   # Registration/Ticket model
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── participant.js    # Participant routes
│   │   ├── organizer.js      # Organizer routes
│   │   ├── admin.js          # Admin routes
│   │   └── event.js          # Event browsing routes
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── utils/
│   │   └── helpers.js        # Helper functions (QR, email)
│   ├── scripts/
│   │   └── seedAdmin.js      # Admin account seeding
│   ├── server.js             # Express server setup
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Participant/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── BrowseEvents.jsx
│   │   │   │   ├── EventDetails.jsx
│   │   │   │   ├── Profile.jsx
│   │   │   │   ├── ClubsList.jsx
│   │   │   │   └── ClubDetails.jsx
│   │   │   ├── Organizer/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CreateEvent.jsx
│   │   │   │   ├── EventDetails.jsx
│   │   │   │   └── Profile.jsx
│   │   │   └── Admin/
│   │   │       ├── Dashboard.jsx
│   │   │       └── ManageClubs.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── README.md
└── deployment.txt
```

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
cd Assignment1
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# Edit .env file with your configuration (see Environment Configuration section)
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/felicity?retryWrites=true&w=majority

# JWT Secret (Use a strong random string)
JWT_SECRET=your_very_secret_jwt_key_change_this_in_production

# Admin Credentials (First admin user)
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=admin123

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### MongoDB Setup

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get the connection string and replace in `MONGODB_URI`

#### Gmail Setup for Emails

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Account → Security → App Passwords
3. Use the generated password in `EMAIL_PASSWORD`

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Development Mode

#### Terminal 1: Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

#### Terminal 2: Seed Admin Account

```bash
cd backend
npm run seed-admin
```

This creates the first admin user with credentials from `.env` file.

#### Terminal 3: Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### Production Build

#### Build Frontend

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/dist`

#### Start Backend in Production

```bash
cd backend
npm start
```

## 👥 User Roles

### 1. Admin
- **Pre-provisioned account** (created via seed script)
- **Capabilities:**
  - Create/remove organizer accounts
  - View system statistics
  - Manage club status (activate/deactivate)
  - Reset organizer passwords

**Default Login:**
- Email: `admin@felicity.com`
- Password: `admin123`

### 2. Organizer
- **Admin-created accounts**
- **Capabilities:**
  - Create and manage events
  - View event analytics
  - Export participant data (CSV)
  - Update profile and Discord webhook
  - Publish/close events

### 3. Participant
- **Self-registration**
- **Capabilities:**
  - Browse and search events
  - Register for events
  - View registration history
  - Follow/unfollow clubs
  - Update profile and preferences
  - Receive tickets via email

## 🎯 Core Features

### Participant Features

1. **Registration** - IIIT email validation, interests selection
2. **Event Browsing** - Search, filters, trending events
3. **Event Registration** - Custom forms, QR tickets, email confirmation
4. **Dashboard** - View upcoming, completed, cancelled events
5. **Profile Management** - Edit personal details and preferences
6. **Club Following** - Follow favorite organizers

### Organizer Features

1. **Event Creation** - Draft → Published workflow
2. **Custom Forms** - Build registration forms with multiple field types
3. **Event Management** - Edit, publish, close events
4. **Analytics Dashboard** - Track registrations, revenue, attendance
5. **Participant Management** - View list, search, filter, export CSV
6. **Profile Management** - Update organization details, Discord webhook

### Admin Features

1. **Club Management** - Create, activate, deactivate organizers
2. **Credential Management** - Auto-generate and reset passwords
3. **System Monitoring** - View platform statistics
4. **Access Control** - Manage organizer accounts

## 📚 Libraries & Frameworks

### Backend Dependencies

| Library | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| **express** | ^4.18.2 | Web framework | Industry standard, minimal, flexible framework for Node.js APIs |
| **mongoose** | ^8.0.0 | MongoDB ODM | Elegant schema-based solution, built-in validation, middleware support |
| **bcryptjs** | ^2.4.3 | Password hashing | Secure one-way hashing, prevents rainbow table attacks |
| **jsonwebtoken** | ^9.0.2 | Authentication | Stateless authentication, secure token generation |
| **dotenv** | ^16.3.1 | Environment variables | Secure configuration management, separates secrets from code |
| **cors** | ^2.8.5 | Cross-origin requests | Enables frontend-backend communication |
| **express-validator** | ^7.0.1 | Input validation | Sanitization and validation middleware for Express |
| **nodemailer** | ^6.9.7 | Email service | Send transactional emails, ticket delivery |
| **qrcode** | ^1.5.3 | QR code generation | Generate QR codes for tickets, attendance tracking |
| **multer** | ^1.4.5 | File uploads | Handle multipart/form-data, file upload middleware |
| **json2csv** | ^6.0.0 | CSV export | Convert JSON to CSV for participant data export |

### Frontend Dependencies

| Library | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| **react** | ^18.2.0 | UI library | Component-based architecture, virtual DOM, large ecosystem |
| **react-dom** | ^18.2.0 | DOM rendering | React's rendering library for web applications |
| **react-router-dom** | ^6.20.0 | Routing | Client-side routing, protected routes, navigation |
| **axios** | ^1.6.2 | HTTP client | Promise-based, interceptors for auth, automatic JSON handling |
| **react-toastify** | ^9.1.3 | Notifications | User feedback, non-intrusive notifications |
| **vite** | ^5.0.8 | Build tool | Fast HMR, optimized builds, modern dev experience |

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register/participant    - Register new participant
POST   /api/auth/login                   - Login (all roles)
GET    /api/auth/me                      - Get current user
PUT    /api/auth/password                - Update password
```

### Participant Endpoints

```
GET    /api/participant/dashboard        - Get dashboard data
GET    /api/participant/profile          - Get profile
PUT    /api/participant/profile          - Update profile
POST   /api/participant/register/:id     - Register for event
GET    /api/participant/ticket/:id       - Get ticket details
POST   /api/participant/follow/:id       - Follow/unfollow club
```

### Organizer Endpoints

```
GET    /api/organizer/dashboard          - Get dashboard & analytics
POST   /api/organizer/events             - Create event
GET    /api/organizer/events/:id         - Get event details
PUT    /api/organizer/events/:id         - Update event
POST   /api/organizer/events/:id/publish - Publish event
GET    /api/organizer/events/:id/export  - Export participants CSV
GET    /api/organizer/profile            - Get profile
PUT    /api/organizer/profile            - Update profile
```

### Admin Endpoints

```
GET    /api/admin/dashboard/stats        - Get system statistics
GET    /api/admin/clubs                  - Get all clubs
POST   /api/admin/clubs                  - Create new club
GET    /api/admin/clubs/:id              - Get club details
PUT    /api/admin/clubs/:id              - Update club
DELETE /api/admin/clubs/:id              - Deactivate club
POST   /api/admin/clubs/:id/reset-password - Reset club password
```

### Event Endpoints

```
GET    /api/events/browse                - Browse/search events
GET    /api/events/:id                   - Get event details
GET    /api/events/clubs/list            - Get all clubs
GET    /api/events/clubs/:id             - Get club details with events
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

#### Vercel
```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

#### Netlify
```bash
cd frontend
npm run build
# Upload 'dist' folder to Netlify
```

### Backend Deployment (Render/Railway)

#### Render
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables from `.env`

#### Railway
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

### MongoDB Atlas
- Already cloud-hosted
- Update `MONGODB_URI` in production environment variables
- Whitelist deployment server IPs

## 🧪 Testing

### Local Testing Checklist

#### Authentication
- [ ] Participant registration with IIIT email
- [ ] Participant registration with non-IIIT email
- [ ] Login with all roles
- [ ] JWT token persistence
- [ ] Logout functionality
- [ ] Password update

#### Participant Features
- [ ] Browse events with search
- [ ] Apply filters (type, eligibility, date)
- [ ] View event details
- [ ] Register for event
- [ ] Receive email with ticket
- [ ] View dashboard with registrations
- [ ] Follow/unfollow clubs
- [ ] Update profile

#### Organizer Features
- [ ] Create draft event
- [ ] Add custom registration form
- [ ] Publish event
- [ ] View registrations
- [ ] Export CSV
- [ ] Update event details
- [ ] Close event
- [ ] Update profile

#### Admin Features
- [ ] View dashboard statistics
- [ ] Create new organizer
- [ ] View generated credentials
- [ ] Deactivate/activate club
- [ ] Reset organizer password

## 📝 Important Notes

### Security Considerations
- All passwords are hashed using bcrypt
- JWT tokens expire after 30 days
- Protected routes require authentication
- Role-based access control enforced
- Input validation on all endpoints

### Email Configuration
- Ensure EMAIL_PASSWORD is an App Password (not your Gmail password)
- Enable "Less secure app access" if using regular SMTP
- For production, consider services like SendGrid, AWS SES

### Database
- Regular backups recommended
- Index optimization for search queries
- Connection pooling handled by Mongoose

## 📄 License

This project is created for academic purposes as part of the DASS course assignment.

## 👨‍💻 Developer

Created by [Your Roll Number]

---

**Note:** This is a complete implementation of the Felicity Event Management System. All core features (Part 1) are fully functional. Advanced features (Part 2) can be implemented based on requirements.
