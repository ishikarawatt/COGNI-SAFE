<div align="center">

<img src="https://img.shields.io/badge/CogniSafe-Cognitive%20Health%20AI-0A1628?style=for-the-badge&logo=brain&logoColor=E8A020" />

# 🧠 CogniSafe
### *Hear the Difference. Before It's Too Late.*

> **AI-powered voice biomarker analysis for early cognitive health monitoring.**
> Detect subtle changes in speech patterns that may indicate early cognitive decline — using just your voice.

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-cogni--safe.vercel.app-E8A020?style=for-the-badge)](https://cogni-safe.vercel.app)
[![ML API](https://img.shields.io/badge/🤗%20ML%20API-HuggingFace%20Spaces-FF9D00?style=for-the-badge)](https://alamfarzann-cognisafe-ml.hf.space/health)
[![License](https://img.shields.io/badge/License-MIT-0A1628?style=for-the-badge)](LICENSE)

<br/>

> Every 3 seconds, someone in the world develops dementia.
> 50 million people are living with it today. Most are diagnosed **years too late**.
> CogniSafe gives families the one thing they desperately want — **time**.

</div>

---

## 📖 Table of Contents

1. [What is CogniSafe?](#-what-is-cognisafe)
2. [Why Does CogniSafe Exist?](#-why-does-cognisafe-exist)
3. [Key Features](#-key-features)
4. [System Architecture](#️-system-architecture)
5. [Data Flow Flowchart](#-data-flow-flowchart)
6. [AI/ML Pipeline](#-aiml-pipeline)
7. [The 14 Biomarkers](#-the-14-biomarkers)
8. [Frontend](#️-frontend)
9. [Backend](#️-backend)
10. [Developer Guide](#-developer-guide)
11. [API Reference](#-api-reference)
12. [Why Voice?](#-why-voice)
13. [Competitive Landscape](#-competitive-landscape)
14. [Roadmap](#️-roadmap)
15. [Team](#-team)
16. [License](#-license)

---

## 🧠 What is CogniSafe?

CogniSafe is a **non-invasive, voice-first cognitive health monitoring platform** that leverages artificial intelligence to detect early signs of cognitive decline through speech analysis.

Instead of expensive MRI scans ($1,000–$3,000) or clinical neuropsychological tests ($500–$2,000), CogniSafe asks you to speak for just **3 minutes** — describing a picture using a clinically-validated task — and then lets advanced AI models analyze your speech.

### 🎯 Who is it for?

| Persona | Use Case | Benefit |
|---|---|---|
| 👨‍👩‍👧 **Remote Caregivers** | Monitor an aging parent's cognitive health from across the country | Early detection from home, no clinic visits |
| 🏈 **Retired Athletes** | Track potential CTE-related cognitive changes over time | Longitudinal monitoring for head injury sequelae |
| 👫 **Concerned Spouses** | Get early, objective signals before a clinical diagnosis | Peace of mind with data-driven insights |
| 🏥 **Neurologists** | Supplement clinical visits with longitudinal voice data | Objective biomarkers between appointments |
| 🧬 **Researchers** | Build the world's largest longitudinal voice dataset | Advance cognitive health science |

---

## ❓ Why Does CogniSafe Exist?

### The Problem

**Cognitive decline is diagnosed too late.** Most neurodegenerative diseases (Alzheimer's, Parkinson's, dementia) are detected only when symptoms become obvious — sometimes **5–10 years after neurological changes begin**.

By that point, meaningful intervention windows have often closed.

#### Current Gaps in Healthcare

| Gap | Impact |
|---|---|
| 🕐 **Late Detection** | Diagnosis occurs when cognitive loss is already significant (MMSE ≤ 23) |
| 💰 **High Cost** | Neuroimaging and assessments cost thousands; insurance often doesn't cover screening |
| 🏥 **Accessibility** | Rural areas lack specialists; waiting times exceed 6 months |
| 📉 **No Longitudinal Data** | Most assessments are one-time snapshots; no easy trend monitoring |
| 👥 **Family Blindness** | Spouses/children lack objective tools to detect gradual changes |

### The Solution: CogniSafe

CogniSafe closes these gaps with:

✅ **Early Detection** — Detects statistically significant changes years before clinical diagnosis  
✅ **Affordable** — FREE vs. $1,000+ per clinical assessment  
✅ **Accessible** — Requires only a smartphone and internet; works from home  
✅ **Longitudinal** — Daily 3-minute sessions build a personal health baseline over time  
✅ **Family-Friendly** — Plain-language dashboard designed for non-clinicians  
✅ **Evidence-Based** — Built on 15+ years of peer-reviewed voice biomarker research  

> **The core insight:** Your voice is a window into your brain. We've built the lens.

---

## ✨ Key Features

### 🎙️ Voice Session Recording
- **Daily 3-minute sessions** with a validated picture description task
- **Live voice orb** that pulses in real-time with your speech amplitude
- **WebRTC audio capture** directly in the browser — no app download needed
- Automatic conversion and processing of browser-recorded audio
- Privacy-first: Audio processed on-device before transmission

### 📊 14-Biomarker Analysis Engine
- **10 Acoustic Biomarkers** — extracted via openSMILE eGeMAPS
  - Pitch, jitter, shimmer, harmonics-to-noise ratio, articulation rate, pauses, etc.
- **4 NLP Biomarkers** — extracted via spaCy + sentence-transformers
  - Semantic coherence, lexical diversity, idea density, syntactic complexity
- **Full analysis returned in under 240 seconds** on CPU

### 🔴 Risk Tier System

Real-time risk assessment with color-coded tiers:

| Tier | Color | Meaning | Action |
|---|---|---|---|
| 🟢 **Green** | Green | No anomalies detected — baseline stable | Continue monitoring |
| 🟡 **Yellow** | Yellow | Mild deviations — worth monitoring | Weekly check-ins |
| 🟠 **Orange** | Orange | Moderate anomalies — recommend follow-up | Consult healthcare provider |
| 🔴 **Red** | Red | Significant deviation — seek professional advice | Schedule neurologist appointment |

### 📈 Longitudinal Trend Dashboard
- **14 biomarker cards** — each with 90-day sparkline charts
- **Personal baseline comparison** — compared against YOUR own history, not population averages
- **2-sigma anomaly detection** — statistically rigorous deviation flagging
- Confidence intervals showing model certainty
- Export trends as PDF for sharing with healthcare providers

### 🧬 3D Semantic Drift Sphere
- Interactive Three.js visualization of your **vocabulary over time**
- Word nodes sized by frequency, colored by recency
- **Time slider** — drag to see how your vocabulary has changed over 6 months
- Detect semantic drift (loss of vocabulary richness)

### 👨‍👩‍👧 Caregiver Dashboard
- Plain-language status: *"Dad is doing WELL this week"*
- 30-day calendar heat map showing session consistency
- Zero medical jargon — designed for family members, not clinicians
- PDF report download for sharing with a neurologist
- Multi-user support for family members to monitor the same patient

---

## 🏗️ System Architecture

The CogniSafe platform is built as a **distributed system** with three main components: Frontend (React), Backend (FastAPI), and AI/ML Pipeline (Python + ML frameworks).

![System Architecture](./assets/architecture_cognisafe.png)

### Key Design Principles

- **Microservices-friendly** — Each component can scale independently
- **Stateless backend** — JWT-based auth enables horizontal scaling
- **Privacy-first** — Audio stays encrypted in transit and at rest
- **Resilient** — Graceful degradation if ML service is temporarily unavailable
- **Real-time** — WebSockets for live session streaming (future enhancement)

---

## 🔄 Data Flow Flowchart

![System Architecture](./assets/flowchart.png)

## 🤖 AI/ML Pipeline

> **Deployed at:** `https://alamfarzann-cognisafe-ml.hf.space`

The AI pipeline is the **heart of CogniSafe**. It accepts a raw audio file and returns a complete cognitive health snapshot in under **240 seconds on CPU**.

### Pipeline Architecture

![System Architecture](./assets/ai_ml.png)


### Tech Stack — ML

| Tool | Purpose |
|---|---|
| Python 3.11 | Core runtime |
| FastAPI + Uvicorn | API server |
| OpenAI Whisper Base | Speech-to-text |
| openSMILE (eGeMAPS) | Acoustic feature extraction |
| spaCy v3.7 | NLP processing |
| sentence-transformers (MiniLM-L6-v2) | Semantic embeddings |
| scikit-learn v1.3 | Anomaly detection |
| librosa + soundfile | Audio utilities |
| SQLite | Historical baseline tracking |
| ffmpeg | Audio conversion |
| HuggingFace Spaces + Docker | Hosting |

---

## 📊 The 14 Biomarkers

CogniSafe analyzes **14 clinically-validated voice biomarkers** across acoustic and linguistic dimensions.

| # | Biomarker | Type | Measurement | Clinical Significance |
|---|---|---|---|---|
| 1 | `speech_rate` | Acoustic | Words per minute | Slowed speech = cognitive load ↑ |
| 2 | `articulation_rate` | Acoustic | WPM excluding pauses | Articulation issues = motor control decline |
| 3 | `pause_frequency` | Acoustic | Pauses per minute | Increased pauses = planning difficulties |
| 4 | `pause_duration_mean` | Acoustic | Seconds per pause | Longer pauses = reduced working memory |
| 5 | `filled_pause_rate` | Acoustic | Uh/um per minute | Filled pauses = lexical retrieval difficulty |
| 6 | `pitch_mean` | Acoustic | Hz (fundamental freq) | Pitch changes correlate with neurological health |
| 7 | `pitch_range` | Acoustic | Variability in pitch | Reduced range = reduced emotional/cognitive control |
| 8 | `jitter` | Acoustic | Cycle-to-cycle F0 variation | Jitter ↑ = vocal cord dysfunction |
| 9 | `shimmer` | Acoustic | Amplitude variation | Shimmer ↑ = motor control issues |
| 10 | `HNR` | Acoustic | Harmonics-to-noise ratio | HNR ↓ = vocal pathology or neurological change |
| 11 | `lexical_diversity` | NLP | MTLD vocabulary richness | Diversity ↓ = reduced verbal fluency |
| 12 | `semantic_coherence` | NLP | Sentence-to-sentence flow | Coherence ↓ = disorganized thinking |
| 13 | `idea_density` | NLP | Propositions per word | Density ↓ = reduced verbal productivity |
| 14 | `syntactic_complexity` | NLP | Average parse tree depth | Complexity ↓ = simplified speech |

> **All biomarkers are compared against the user's own baseline** — not population norms. This enables personalized, sensitive detection of *individual drift*.
👉 [AI/ML Documentation](./cognisafe-deploy/README.md)
---

## 🖥️ Frontend

> **Live at:** `https://cogni-safe.vercel.app`

Built with **React 18 + Vite**, the frontend is optimized for clarity, emotional impact, and accessibility.

### Pages & Features

| Route | Component | Purpose |
|---|---|---|
| `/auth` | Login/Register | JWT-based authentication |
| `/dashboard` | Biomarker Dashboard | 14 biomarker cards, trends, risk tier |
| `/session` | Voice Recorder | 2-min recording with live orb animation |
| `/brain` | 3D Sphere | Interactive semantic drift visualization |
| `/ar-report` | Health Report | AI-generated cognitive report |
| `/caregiver` | Caregiver View | Family member dashboard |

### Tech Stack — Frontend

| Technology | Role |
|---|---|
| React 18 + Vite | Core framework & bundler |
| TailwindCSS | Styling |
| Framer Motion | Animations |
| Three.js | 3D semantic sphere |
| Recharts | Biomarker trend charts |
| React Router v6 | Client-side routing |
| Web Audio API + MediaRecorder | Microphone capture |
| zustand | State management |
| axios + date-fns | HTTP client & date utilities |
| Vercel | Hosting |

👉 [Frontend Documentation](./cognisafe-frontend/README.md)

---

## ⚙️ Backend

> Built with **FastAPI (Python)**, deployed on **Render**.

Handles authentication, session persistence, trend calculations, and report generation.

### Tech Stack — Backend

| Technology | Role |
|---|---|
| Python 3.11 | Core runtime |
| FastAPI + Uvicorn | API server |
| PostgreSQL | Primary database |
| SQLAlchemy | ORM |
| PyJWT + bcrypt | Auth & password hashing |
| Pydantic | Request/response validation |
| Docker | Containerization |
| Render | Hosting |

👉 [Backend Documentation](./cognisafe-backend/README.md)

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | JWT token generation |
| `GET` | `/api/auth/me` | Get current user profile |

### Sessions

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/sessions/today` | Check if user recorded today |
| `POST` | `/api/sessions` | Save ML results to DB |
| `GET` | `/api/sessions/history` | Get all past sessions (paginated) |
| `GET` | `/api/sessions/{id}` | Get specific session details |

### Analytics & Reports

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/trends` | Get biomarker trend data (30 days) |
| `POST` | `/api/reports/generate` | Generate AI health report |
| `GET` | `/api/reports/{id}` | Download generated report |

### Caregiver

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/caregiver/link` | Create share link for family |
| `GET` | `/api/caregiver/view/{token}` | Caregiver-accessible dashboard |

---

## 🚀 Developer Guide

This project is a **full-stack application** with three independent services:

- 🤖 **AI/ML Pipeline** — Voice biomarker analysis (Python + FastAPI)
- ⚙️ **Backend API** — Session storage & trend calculations (Python + FastAPI)
- 🎨 **Frontend Web App** — User interface (React + Vite)

### Prerequisites

- Python 3.11+
- FastAPI 18+
- PostgreSQL 14+
- ffmpeg (`brew install ffmpeg` / `choco install ffmpeg`)

### One-Command Local Setup (Windows)

```batch
start_all.bat
```

This launches all three services in separate terminal windows.

### Manual Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/workishika7-source/CogniSafe.git
cd CogniSafe
```

#### 2. Start ML Pipeline

```bash
cd cognisafe-deploy
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cd api
python main.py
# Runs on http://localhost:7860
```

#### 3. Start Backend

```bash
cd cognisafe-backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Edit with your config
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

#### 4. Start Frontend

```bash
cd cognisafe-frontend
npm install
cp .env.example .env.local      # Edit with backend URL
npm run dev
# Runs on http://localhost:5173
```

### Running Tests

```bash
npm test
```

---

### 📚 Component Documentation

| Component | Docs |
|---|---|
| 🤖 ML Pipeline | `cognisafe-deploy/README.md` |
| ⚙️ Backend API | `cognisafe-backend/README.md` |
| 🎨 Frontend | `cognisafe-frontend/README.md` |

### 🔄 Contributing Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes & test locally

# 3. Commit with clear message
git commit -m "feat: add biomarker visualization"

# 4. Push and open PR
git push origin feature/your-feature
```

### 🚢 Deployment

| Service | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | `vercel deploy` |
| Backend | Render | Push to `main` (auto-deploys) |
| ML Pipeline | HuggingFace Spaces | Push to Spaces repo |

---

## 🧪 Why Voice?

Research shows that **speech and language changes precede clinical dementia diagnosis by 5–10 years** — before structural brain changes are visible on MRI.

### Key Findings (Peer-Reviewed Literature)

| Biomarker | Finding | Source |
|---|---|---|
| Lexical Diversity | Declines 5–10 years before MCI diagnosis | Garrard et al. (2005) |
| Pause Patterns | Increase with cognitive load & planning difficulty | Tsoy et al. (2021) |
| Semantic Coherence | Drops as working memory degrades | Roark et al. (2011) |
| Pitch Variability | Correlates with neurological health | Herff et al. (2014) |
| Speech Rate | Slows with frontal lobe dysfunction | Murray et al. (2014) |

### Why CogniSafe Uses Voice

✅ **Early Detection** — Speech changes appear years before clinical diagnosis  
✅ **Non-invasive** — No needles, no radiation, no expensive equipment  
✅ **Accessible** — Requires only a smartphone and internet connection  
✅ **Continuous** — Users can monitor from home daily; not just annual checkups  
✅ **Standardized** — Picture description task is validated across 30+ years of research  
✅ **Quantifiable** — AI extracts 14 objective biomarkers; removes human bias  

---

## 🏆 Competitive Landscape

| Solution | Cost/Month | Invasiveness | Test Frequency | Longitudinal | Tech |
|---|---|---|---|---|---|
| 🧲 MRI Brain Scan | $100–250 | Very High | Yearly | ❌ | Neuroimaging |
| 🧩 Neuropsych Tests | $50–150 | Medium | Yearly | Partial | Clinician-led |
| ⌚ Wearables | $10–30 | None | Continuous | ✅ | Accelerometer |
| 📱 Mood/Cognitive Apps | Free–$20 | None | Daily | Partial | Self-reported |
| 🔬 Blood Biomarkers | $50–200 | Low | Every 6mo | ✅ | Lab test |
| 🧠 **CogniSafe** | **$15** | **None** | **Daily** | **✅** | **Voice AI** |

### CogniSafe Advantages

| Advantage | Details |
|---|---|
| 💰 Cost | 5–10× cheaper than clinical assessments |
| 📅 Frequency | Daily monitoring vs. annual checkups |
| 🏠 Accessibility | Home-based; no specialist appointments |
| 🎯 Objectivity | AI removes clinician bias |
| 🔗 Complementary | Complements blood biomarkers and imaging |

---

## 🗺️ Roadmap
![System Architecture](./assets/road_map.png)

### Phase Details

| Phase | Timeline | Milestones | Status |
|---|---|---|---|
| 🚀 MVP | 2026 Q1–Q2 | Web app launch, 14 biomarkers, basic trends | ✅ Shipping |
| 📱 Mobile | 2026 Q3 | React Native iOS + Android, offline mode | 🔄 In Development |
| 🏥 Healthcare | 2026 Q4 | Insurance partnerships, B2B2C model, HIPAA compliance | 📋 Planned |
| 📋 FDA | 2027 | Breakthrough Device Designation, clinical validation study | 🔮 Future |
| 💊 Pharma | 2028–2030 | Clinical trial API, pharma licensing, global rollout | 🔮 Future |

### Backlog

- 🎨 **UI/UX** — A/B tested caregiver dashboard redesign
- 🔐 **Privacy** — End-to-end encryption, on-device ML inference
- 🌍 **Multilingual** — Biomarkers for Spanish, Mandarin, French
- 📊 **Advanced Analytics** — Predictive modeling, risk trajectory forecasting
- 🤝 **Integration** — Apple Health, Google Fit, EHR systems

---

## 👥 Team

**Team FAIV** — Built at *Watch The Code Hackathon 2026*

| Member | Role | GitHub | 
|---|---|---|
| Ishika Rawat | 🎨 Frontend Engineer | [@ishikarawatt](https://github.com/ishikarawat) |
| Farjan Alam | 🤖 AI/ML | [@SyntaxSaviour](https://github.com/alamfarzan) |
| Vansh Singh | ⚙️ Backend Engineer | [@vanshsingh2411](https://github.com/vanshsingh) |
| Akansha Parley | 📋 Product & Demo | [@akansaa](https://github.com/akanshaparley) | 

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Free to use, modify, and distribute for personal and commercial projects.

---

<div align="center">

Built with 💙 by **Team FAIV**

> *"We are not building an app. We are building the world's largest longitudinal cognitive dataset —*
> *and using it to give families the one thing they desperately want: **time**."*

<br/>

Every 3 seconds, someone develops dementia.
**CogniSafe gives families 5–10 years of early warning.**

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-cogni--safe.vercel.app-E8A020?style=for-the-badge)](https://cogni-safe.vercel.app)
[![HuggingFace](https://img.shields.io/badge/🤗%20ML%20API-HuggingFace%20Spaces-FF9D00?style=for-the-badge)](https://alamfarzann-cognisafe-ml.hf.space/health)

</div>
