# 🚀 AlumniConnect: The Ultimate NIT JSR Network

**Built with ❤️ and way too much caffeine for the PCON HackSphere 48-Hour Hackathon.**

Hey there! 👋 Welcome to AlumniConnect. 

We built this platform over the last 48 hours to solve a massive problem on campus: students struggle to get cold referrals, and alumni get spammed with untargeted requests. We wanted to build an ecosystem that makes networking frictionless, verified, and highly rewarding for everyone involved. 

Instead of a boring technical manual, let’s take a quick tour of how to actually use what we built!

---

## 🗺️ How to Use the Platform (A Quick Tour)

### Step 1: The "Magic" Login
We didn't want users fumbling with dropdown menus to select their roles. 
*   Head to the login page and register using an official NIT JSR email (e.g., `2025UGCS034@nitjsr.ac.in`). 
*   **What happens behind the scenes:** Our backend regex instantly reads your branch code (`CS`), maps it to your department, calculates your graduation year, and automatically routes you into a `Student` or `Alumni` workspace. 

### Step 2: The Student Experience 🎓
If you logged in as a student, your dashboard is your career command center:
1.  **Meet Your AI Copilot:** Scroll down to the AI tools. Paste a target job description and upload a mock PDF resume. Our Gemini-powered AI will instantly generate an ATS match score (complete with a slick Chart.js visual) and give you a step-by-step upskilling roadmap.
2.  **Generate a Pitch:** Don't know how to message an alumni? Use the Referral Pitch Synth to let the AI draft a hyper-professional LinkedIn cold outreach message for you.
3.  **Discover Alumni:** Use the massive Universal Search bar. Type "Google" or "Software Engineer" to instantly pull up visually stunning profile cards of verified alumni you can connect with.

### Step 3: The Alumni Experience 💼
If you logged in as an alumni, you get a totally different workspace:
1.  **Post an Opportunity:** Use the quick-form to post a referral opportunity for a job at your company. 
2.  **Watch the Points Roll In:** Posting a job instantly awards you **+10 contribution points** via automated database triggers. 
3.  **Manage the Inbox:** When a student requests a referral, it pops up in your exclusive Inbox. Click "Approve" to send the referral and instantly earn **+50 contribution points**.
4.  **Climb the Ranks:** Watch your name climb the Live Leaderboard as you give back to the college community!

---

## 🧠 The Brains Behind the Operation

We wanted to make sure the best alumni get the most visibility. When students search for opportunities, we don't just list them randomly. We built a custom ranking engine that scores alumni based on how much they give back:

`Score = (0.40 × Skill Similarity) + (0.35 × Scaled Contribution) + (0.25 × Seniority Ratio)`

### 🛠️ Our Tech Stack
*   **Frontend:** Vanilla JS, Bootstrap 5 (Custom Glassmorphism UI), GSAP & Lenis (Smooth scrolling physics), Chart.js
*   **Backend:** FastAPI (Python), Supabase (PostgreSQL & Row Level Security)
*   **AI Integration:** Google Gemini 3.1-Flash-Lite & pdfplumber

---
*Thanks for checking out AlumniConnect! We're incredibly proud of what we managed to engineer this weekend.*