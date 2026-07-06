<div align="center">
  <h1>📚 Studora</h1>
  <p>The ultimate collaborative study platform built for modern students.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
</div>

---

## ✨ Features

- **🏫 Study Rooms:** Create private study rooms and invite classmates via unique invite codes.
- **📄 Document Storage:** Upload and manage class materials, PDFs, and PowerPoint presentations securely via Amazon S3.
- **⏰ Smart Assignments:** Keep track of homework with strict deadlines and automatic 24-hour / 4-hour email reminders.
- **🤖 AI Study Assistant:** Harness the power of Google Gemini AI to instantly generate 5-question practice quizzes from any uploaded study material (PDFs, PPTXs, docs).
- **🔒 Secure Authentication:** Fast, modern login and sign-up flows powered by Better Auth.
- **🎨 Modern UI/UX:** A stunning, fully responsive dark-mode first interface built with Tailwind CSS and Framer Motion.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** Next.js Serverless API Routes
- **Database:** PostgreSQL (with Drizzle ORM)
- **Storage:** Amazon S3
- **Authentication:** Better Auth
- **AI Engine:** Google Gemini (gemini-2.5-flash)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed (v18+ recommended) and a PostgreSQL database ready (e.g., Supabase, Neon).

### 1. Clone the repository
```bash
git clone https://github.com/Neev-Prajapati/Studora.git
cd Studora/studora-web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root of `studora-web` and add the following keys:

```env
# Database
DATABASE_URL="your_postgresql_url"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your_random_secret_string"
BETTER_AUTH_URL="http://localhost:3000"

# Amazon S3 (For file uploads)
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="your_aws_region"
S3_BUCKET_NAME="your_bucket_name"

# AI Integration
GEMINI_API_KEY="your_google_gemini_api_key"

# Email Notifications (SMTP)
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# Cron Job Secret
CRON_SECRET="your_cron_secret"
```

### 4. Push Database Schema
```bash
npx drizzle-kit push
```

### 5. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the app!

## ☁️ Deployment

Studora is optimized for deployment on **Vercel**. 
1. Connect your GitHub repository to Vercel.
2. Add all the environment variables from `.env.local` to your Vercel project settings.
3. Update `BETTER_AUTH_URL` to your production URL (e.g., `https://studoradrive.vercel.app`).
4. Set up an external cron job (e.g., using cron-job.org) to ping `https://your-domain.com/api/cron` every hour using your `CRON_SECRET` for email reminders.

---
*Built with ❤️ for students.*
