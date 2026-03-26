🚀 EA11AUDIT— Web Accessibility Audit Platform

Live : https://error-flow-hn4.vercel.app/

📌 Overview

EA11AUDIT is a full-stack, AI-powered web accessibility auditing platform that helps developers identify, understand, and fix accessibility issues across modern websites.

It goes beyond traditional tools by combining multi-page crawling, WCAG-based audits, AI-powered remediation, and interactive dashboards into a single unified system.

Built to solve the problem of fragmented accessibility tooling and lack of actionable insights in existing solutions.

🎯 Problem Statement

Modern web applications often fail to meet accessibility standards like WCAG 2.2, making them unusable for:

Visually impaired users
Users with motor disabilities
Users with cognitive challenges

Existing tools:

Provide raw reports
Lack visualization
Don’t support multi-page/SPA analysis

👉 EA11AUDIT solves this by providing contextual, visual, and AI-assisted accessibility analysis.

✨ Key Features
🔍 1. Multi-Page Accessibility Audit
Crawl entire websites (including SPAs)
Automatically discover routes
Perform WCAG 2A/AA audits using axe-core
📊 2. Interactive Dashboard
Accessibility score visualization
Charts (bar, pie, radar)
Issue breakdown by severity & rule
Page-wise insights
🤖 3. AI-Powered Insights & Fixes
Generates:
Accessibility scores
Issue explanations
Code-level fixes
Suggests:
ARIA labels
Semantic HTML improvements
Contrast fixes
📸 4. Visual Issue Exploration
Screenshots of issues
DOM-level inspection
Highlights affected elements
📤 5. Report Exporting
PDF Reports
Excel Reports
Shareable links
🔐 6. Authentication System
OTP-based email verification
JWT authentication
Secure user/project management
🌐 7. Chrome Extension
Scan live websites instantly
Highlight issues directly in browser
Get AI fixes in real-time
🏗️ Architecture
Frontend (React + Vite)
        │
        ▼
Backend (Node + Express) ─── MongoDB
        │
        ├── Puppeteer / Playwright (Rendering)
        ├── axe-core (Accessibility Engine)
        ├── AI APIs (Gemini / OpenAI)
        └── Report Generators (PDF/Excel)
⚙️ Tech Stack
🖥️ Frontend
React (Vite)
Tailwind CSS
Recharts (Data Visualization)
Framer Motion (Animations)
🔧 Backend
Node.js
Express.js
MongoDB (Mongoose)
🧠 AI Integration
Google Gemini (Insights generation)
OpenAI (Extension-based fixes)
🕸️ Crawling & Auditing
Puppeteer / Playwright
axe-core (WCAG compliance engine)
📦 Other Tools
PDFKit (PDF reports)
ExcelJS (Excel export)
Nodemailer (OTP emails)
📁 Folder Structure
ErrorFlow/
│
├── Backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── src/
│   │   ├── crawler/
│   │   ├── axe/
│   │   ├── renderer/
│   │   ├── extractor/
│   │   └── services/
│   ├── utils/
│   └── output/
│
├── Frontend/
│   ├── components/
│   ├── pages/
│   └── App.jsx
│
├── Extension/
│   ├── content scripts
│   ├── background scripts
│   └── sidepanel
│
└── README.md
🔄 Workflow
🧩 Audit Flow
User enters a URL
Backend crawls site
Each page:
Rendered using headless browser
axe-core audit executed
DOM + screenshots captured
Data processed into:
Summary
Violations
Metrics
Frontend displays:
Dashboard
Charts
Visual insights
AI generates:
Fix suggestions
Recommendations
🚀 Getting Started
1️⃣ Clone the Repository
git clone https://github.com/OmkarM9090/ErrorFlow_hn4.git
cd errorflow
2️⃣ Install Dependencies
Backend
cd Backend
npm install
Frontend
cd Frontend
npm install
3️⃣ Setup Environment Variables

Create .env in Backend:

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
EMAIL_USER=your_email
EMAIL_PASS=your_password
4️⃣ Run the Project
Backend
npm run dev
Frontend
npm run dev
📡 API Endpoints
Endpoint	Method	Description
/api/audit	POST	Run accessibility scan
/api/audit/insights	POST	Get AI insights
/api/auth/signup	POST	Register user
/api/auth/login	POST	Login
/export/pdf	GET	Download PDF report
/export/excel	GET	Download Excel report
🎯 Use Cases
Developers auditing websites
Agencies generating client reports
Accessibility testers
Product teams tracking accessibility
🧠 Why EA11AUDIT?

✔ Combines multiple tools into one platform
✔ Handles SPAs (most tools fail here)
✔ AI-powered actionable fixes (not just reports)
✔ Visual + contextual insights
✔ End-to-end workflow (scan → analyze → fix → export)

🔮 Future Enhancements
ML-based issue prediction
Accessibility score tracking over time
Team collaboration features
CI/CD integration
Real-time monitoring
🤝 Contributing

Contributions are welcome!

fork → clone → create branch → commit → PR
