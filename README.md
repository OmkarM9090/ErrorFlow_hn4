<h1 align="center">🚀 A11YAUDIT — AI-Powered Web Accessibility Audit Platform</h1>

<p align="center">
  <i>A full-stack, automated accessibility auditing platform built to identify, visualize, and fix WCAG 2.2 compliance issues across modern web applications.</i>
</p>

<p align="center">
  <a href="https://error-flow-hn4.vercel.app/" target="_blank"><strong>🌐 View Live Project</strong></a> · 
  <a href="#-getting-started"><strong>⚙️ Getting Started</strong></a> · 
  <a href="#-api-endpoints"><strong>📡 API Docs</strong></a>
</p>

---

## 📌 Overview

**EA11AUDIT** (A11yAudit) goes beyond traditional accessibility tools by combining multi-page crawling, standard WCAG 2.2 audits, AI-powered remediation, and interactive tracking dashboards into a single, unified system. 

Built originally for **Hackniche 4.0 (PS2)**, this platform solves the problem of fragmented accessibility tooling by providing developers with actionable insights, visual context, and automated code-level fixes rather than just raw, hard-to-read reports.

## 🎯 The Problem

Modern web applications frequently fail to meet accessibility standards (WCAG 2.2), unintentionally making them unusable for visually impaired users, individuals with motor limitations, or those with cognitive challenges. 

**Existing tools fall short because they:**
- ❌ Provide raw data dumps without visual context.
- ❌ Lack tracking capabilities over multiple scans.
- ❌ Fail to support deep multi-page or Single Page Application (SPA) analysis.

**👉 EA11AUDIT solves this by providing contextual, visual, and AI-assisted analysis.**

---

## ✨ Key Features

### 🔍 1. Deep Multi-Page Analysis
- Enable scanning across multiple pages within a website through manual input or automated route discovery.
- Supports complex SPAs using headless browser rendering (Puppeteer/Playwright).
- Performs strict WCAG 2A/AA compliance audits using the `axe-core` engine.

### 🤖 2. AI-Powered Remediation
- Integrates **Featherless.ai** & **Google Gemini API** to provide real-time, context-aware AI suggestions.
- Generates optimized, ready-to-use code snippets (e.g., ARIA labels, semantic HTML structures, and contrast-compliant CSS) to bridge the gap between identification and resolution.

### 📊 3. Interactive Dashboards & Project Management
- **Dashboard Tracking:** Offers issue summaries, accessibility scoring, and tracks improvements across multiple scans.
- **Project Management:** Organize scans across different websites or projects for comparative tracking.
- Rich visualizations (Bar, Pie, Radar charts) using Recharts.

### 📸 4. Visual Issue Exploration
- Visually and interactively explore detected issues within the page context.
- Highlights affected DOM elements directly via captured screenshots, making it easier to understand their impact on usability.

### 📤 5. Comprehensive Exporting
- Generate and download professional **PDF** and **Excel** audit reports.
- Shareable links for team collaboration.

### 🌐 6. Real-Time Chrome Extension *(Bonus)*
- Scan live websites instantly, highlight issues directly in the browser, and receive real-time AI fixes.

---

## 🏗️ System Architecture

```text
Frontend (React + Vite)
        │
        ▼
Backend (Node + Express) ─── MongoDB
        │
        ├── Puppeteer / Playwright (Headless Rendering & Crawling)
        ├── axe-core (Accessibility Compliance Engine)
        ├── AI APIs (Featherless.ai / Gemini / OpenAI)
        └── Report Generators (PDFKit / ExcelJS)
⚙️ Tech Stack
Category	Technologies Used
Frontend	React.js (Vite), Tailwind CSS, Recharts, Framer Motion
Backend	Node.js, Express.js, JWT Auth
Database	MongoDB (Mongoose)
AI Integration	Featherless.ai, Google Gemini API, OpenAI API
Crawling & Auditing	Puppeteer, Playwright, axe-core
Utilities	PDFKit, ExcelJS, Nodemailer (OTP Verification)
🚀 Getting Started
1️⃣ Clone the Repository
Bash
git clone [https://github.com/OmkarM9090/ErrorFlow_hn4.git](https://github.com/OmkarM9090/ErrorFlow_hn4.git)
cd errorflow
2️⃣ Install Dependencies
Backend:

Bash
cd Backend
npm install
Frontend:

Bash
cd Frontend
npm install
3️⃣ Setup Environment Variables
Create a .env file in the Backend directory and configure the following:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
4️⃣ Run the Application
Start the backend and frontend servers concurrently:

Bash
# In Backend Directory
npm run dev

# In Frontend Directory
npm run dev
📡 API Endpoints
Endpoint	Method	Description
/api/audit	POST	Trigger a new accessibility scan for a given URL.
/api/audit/insights	POST	Generate AI-powered remediation insights.
/api/auth/signup	POST	Register a new user (OTP Verification).
/api/auth/login	POST	Authenticate user & receive JWT token.
/export/pdf	GET	Generate and download scan results as PDF.
/export/excel	GET	Generate and download scan results as Excel.
📁 Folder Structure
Plaintext
ErrorFlow/
├── Backend/
│   ├── controllers/      # Route logic and AI integration
│   ├── models/           # Mongoose DB schemas
│   ├── routes/           # Express API endpoints
│   ├── src/              # Core Logic (crawler, axe, renderer, extractor)
│   ├── utils/            # Helpers (Report generators, mailers)
│   └── server.js         # Entry point
│
├── Frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components & Dashboards
│   │   ├── pages/        # Landing & Auth pages
│   │   └── utils/        # State & dashboard logic
│   └── index.html
│
└── Extension/            # Chrome Extension source code
    ├── background.js
    ├── content.js
    └── manifest.json
🔮 Future Scope & Roadmap
We are continuously working to make EA11AUDIT the ultimate accessibility companion. Upcoming features include:

[ ] Automated Audit Scheduling: Allow users to set up daily, weekly, or monthly recurring background scans to track compliance effortlessly.

[ ] AI Rate Limiting & Optimization: Implement robust request queuing and rate-limiting for Featherless.ai and Gemini API integrations to optimize server costs and prevent API abuse.

[ ] GitHub API Integration (Repo Scraping): Enable developers to input a GitHub repository URL directly. The platform will fetch, parse, and statically analyze the frontend source code for accessibility violations before it even gets deployed.

[ ] CI/CD Pipeline Integration: Seamless GitHub Actions/GitLab integration to block PRs that drop the accessibility score below a defined threshold.

🤝 Contributing
Contributions are highly welcome! To contribute:

Fork the repository.

Clone your fork locally.

Create a new Branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.
