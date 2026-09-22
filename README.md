🚀 StartupEvents — Startup & AI Event Discovery Platform

A full-stack platform for discovering startup, technology, and AI events with smart search, location-based filtering, secure authentication, real-time updates, and AI-powered event assistance.

✨ Overview

StartupEvents helps founders, developers, students, and tech enthusiasts discover relevant startup and AI events from a single platform.

The application combines Node.js, Express.js, Supabase, Apify, Socket.IO, and Gemini AI to create a modern event discovery experience.

🎯 Key Features

🔎 Smart Event Search — Search events by keyword, location, and event type.

📍 Location-Based Filtering — Find events relevant to a particular location.

📅 Event Sorting & Pagination — Sort upcoming events and browse results efficiently.

🔥 Trending Events — Surface upcoming and recently relevant events.

💡 Event Suggestions — Search-as-you-type suggestions for faster discovery.

🔐 Secure Authentication — Signup, login, token verification, refresh, and logout using Supabase.

🤖 AI Event Assistant — Gemini-powered assistance for finding and understanding events.

⚡ Real-Time Updates — Socket.IO broadcasts newly fetched event data to connected clients.

🌐 Apify Integration — Fetch and update event data through an Apify actor and webhook.

🛡️ API Security — Authentication middleware, rate limiting, security headers, and protected APIs.

☁️ Deployment Ready — Includes Vercel configuration and deployment documentation.

🧰 Tech Stack

Category

Technologies

Frontend

HTML5, CSS3, JavaScript, React JSX

Backend

Node.js, Express.js

Authentication

Supabase Auth

Database / Auth Platform

Supabase

Event Data

Apify

AI

Google Gemini

Real-Time Communication

Socket.IO

Security

Helmet, CORS, Rate Limiting

Deployment

Vercel

🏗️ Architecture

                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  StartupEvents UI   │
                    │ HTML / CSS / JS     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Express.js API      │
                    │ Auth + Event APIs   │
                    └──────┬───────┬──────┘
                           │       │
              ┌────────────┘       └─────────────┐
              ▼                                  ▼
      ┌───────────────┐                  ┌────────────────┐
      │    Supabase   │                  │     Apify      │
      │ Auth & Users  │                  │ Event Data     │
      └───────────────┘                  └───────┬────────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │ Event Cache    │
                                        └───────┬────────┘
                                                │
                         ┌──────────────────────┴────────────┐
                         ▼                                   ▼
                 ┌────────────────┐                  ┌──────────────┐
                 │   Socket.IO    │                  │ Gemini AI    │
                 │ Real-time data │                  │ Assistant    │
                 └────────────────┘                  └──────────────┘

📁 Project Structure

startup-events-platform/
├── api/                       # API / Vercel entrypoints
├── lib/                       # Auth, event store, rate limiter & utilities
├── public/                    # Frontend files
│   ├── scripts/
│   └── styles/
├── server.js                  # Express + Socket.IO server
├── SUPABASE_SETUP.sql         # Supabase setup
├── vercel.json                # Vercel configuration
├── .env.example               # Environment variable template
├── package.json
└── README.md

⚙️ Getting Started

1. Clone the repository

git clone https://github.com/abhaysharma549/startup-events-platform.git
cd startup-events-platform

2. Install dependencies

npm install

3. Configure environment variables

Create a .env file from the provided template:

cp .env.example .env

Then add your own credentials:

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

APIFY_API_TOKEN=your_apify_api_token
APIFY_WEBHOOK_SECRET=your_webhook_secret
APIFY_ACTOR_ID=your_apify_actor_id

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

⚠️ Never commit .env or real API keys to GitHub.

4. Configure Supabase

Run the SQL provided in:

SUPABASE_SETUP.sql

This prepares the required user profile structure for authentication.

5. Start the application

Development mode:

npm run dev

Production-style startup:

npm start

Open:

http://localhost:3000

Login:

http://localhost:3000/login

🔌 Core API Endpoints

Method

Endpoint

Purpose

GET

/health

Server health check

GET

/api/events

Fetch/filter events

GET

/api/events/trending

Get trending events

GET

/api/events/suggestions

Event search suggestions

POST

/api/apify/fetch

Fetch fresh events from Apify

POST

/api/assistant

Gemini-powered event assistant

POST

/api/auth/register

Register a user

POST

/api/auth/login

Login

POST

/api/auth/refresh

Refresh authentication

GET

/api/auth/verify

Verify access token

POST

/api/auth/logout

Logout

Protected endpoints require a valid Supabase access token.

🔐 Security

The project includes:

Supabase authentication

Bearer-token verification

API rate limiting

CORS configuration

Helmet security headers

Protected event and assistant APIs

Environment-based secret management

Apify webhook secret validation

🚀 Deployment

The project includes Vercel configuration and can be deployed to platforms such as:

Vercel

Render

Railway

For production deployment, configure all required environment variables in the hosting provider rather than committing secrets to the repository.

📚 Documentation

Additional technical documentation is included in the repository:

API_DOCUMENTATION.md

AUTHENTICATION.md

AUTH_IMPLEMENTATION.md

AUTH_QUICK_START.md

SUPABASE_AUTH_GUIDE.md

DEVELOPER_GUIDE.md

VERCEL_DEPLOYMENT.md

TROUBLESHOOTING.md

👨‍💻 Author

Abhay Sharma

B.Tech Computer Science & Engineering

GitHub: https://github.com/abhaysharma549

⭐ Project Highlights

This project demonstrates practical experience with:

Full-Stack Development • REST APIs • Authentication • API Integration • Real-Time Communication • AI Integration • Event Data Processing • Web Deployment

⭐ If you find the project useful, consider giving the repository a star!
