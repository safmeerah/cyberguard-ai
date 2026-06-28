# CyberGuard AI

**AI-Powered Web-Based Cybersecurity Advisory and Awareness System**

An intelligent cybersecurity platform powered by Meta's Llama 3.1 via the Hugging Face Inference API. Ask cybersecurity questions, explore threats, take quizzes, check passwords, analyse URLs, and look up vulnerabilities — all in one dark-themed, browser-based interface.

---

## Features

| Feature | Description |
|---|---|
| **AI Chat Advisor** | Conversational cybersecurity Q&A with history-aware context |
| **Threat Library** | AI-generated structured analysis of 12 major cyber threats |
| **Security Quiz** | AI-generated multiple-choice questions across 8 security topics |
| **Password Analyser** | Client-side entropy calculation with crack-time estimation |
| **URL Phishing Analyser** | Structural analysis of URLs for phishing indicators |
| **CVE Lookup** | Plain-language explanations of software vulnerabilities |
| **Daily Security Tips** | AI-generated actionable daily security advice |

> **Coming Soon:** Live Threat Scanner · Dark Web Monitor · File Malware Analyser

---

## Tech Stack

- **Backend:** Python 3.6+ · Flask 2.0 · Hugging Face Inference API
- **AI Model:** `meta-llama/Llama-3.1-8B-Instruct`
- **Frontend:** HTML5 · CSS3 · Vanilla JavaScript (ES6)
- **Server:** Gunicorn (production)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cyberguard-ai.git
cd cyberguard-ai
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Hugging Face API key:

```
HF_API_KEY=your_key_here
FLASK_SECRET_KEY=any-random-string
```

Get a free API key at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

> **Important:** You must also accept Meta's license for the model at  
> [huggingface.co/meta-llama/Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)  
> before your API key will work with it.

### 4. Run the app

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

---

## Deployment

### Deploy to Railway (Recommended — free tier)

1. Push this repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Select this repository.
4. In **Settings → Variables**, add:
   - `HF_API_KEY` = your Hugging Face key
   - `FLASK_SECRET_KEY` = any random string
5. Railway auto-detects the `Procfile` and deploys with Gunicorn.

### Deploy to Render (free tier)

1. Go to [render.com](https://render.com) → **New Web Service** → connect your GitHub repo.
2. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
3. Add the same environment variables under **Environment**.

### Deploy to PythonAnywhere (free tier)

1. Upload files via the PythonAnywhere file manager or `git clone`.
2. Create a new Web App → Flask → point to `app.py`.
3. Set environment variables in the WSGI configuration file.

---

## Network Issues (University / Proxy Networks)

If you see a **red "AI Offline" banner**, your network may be blocking the Hugging Face API.

Uncomment and fill in the proxy lines in your `.env`:

```
HTTP_PROXY=http://your-proxy-host:port
HTTPS_PROXY=http://your-proxy-host:port
```

---

## Project Structure

```
cyberguard-ai/
├── app.py                  # Flask backend — all API endpoints
├── requirements.txt        # Python dependencies
├── Procfile                # Gunicorn start command (for hosting)
├── .env.example            # Environment variable template
├── templates/
│   └── index.html          # Single-page application HTML
├── static/
│   ├── css/style.css       # Dark cybersecurity theme
│   └── js/app.js           # All browser-side logic
└── docs/
    ├── CyberGuard_AI_Project_Report.docx   # Formal FYP report
    ├── CyberGuard_AI_Technical_Guide.docx  # Technical explanation guide
    ├── generate_report.py  # Script that generated the report
    └── generate_guide.py   # Script that generated the guide
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HF_API_KEY` | Yes | Hugging Face API token |
| `FLASK_SECRET_KEY` | Yes | Secret key for Flask sessions |
| `HTTP_PROXY` | No | Proxy server URL (if needed) |
| `HTTPS_PROXY` | No | Proxy server URL (if needed) |

> **Security:** Never commit your `.env` file. It is excluded by `.gitignore`.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves the web application |
| `/api/chat` | POST | AI conversational advisor |
| `/api/threat-analysis` | POST | Structured threat deep-dive |
| `/api/quiz` | GET | AI-generated MCQ question |
| `/api/security-tip` | GET | Daily security tip |
| `/api/analyze-url` | POST | URL phishing analysis |
| `/api/explain-cve` | POST | CVE plain-language explanation |
| `/api/status` | GET | API connectivity health check |

---

## Acknowledgements

- [Meta AI](https://ai.meta.com/) — LLaMA 3.1 model
- [Hugging Face](https://huggingface.co/) — Inference API
- [Flask](https://flask.palletsprojects.com/) — Web framework

---

*Final Year Project — Department of Computer Science*
