import os
import json
import re
from datetime import datetime
import requests
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fallback-secret-key")
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_ID     = "llama-3.1-8b-instant"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are CyberGuard AI, a world-class cybersecurity expert advisor powered by Meta Llama. "
    "You specialize in: threat analysis, vulnerability assessments, incident response, security best practices, "
    "network/application/endpoint security, and security awareness education. "
    "Explain complex topics clearly and always focus on defensive measures. "
    "Never assist with actual attacks or help bypass security systems maliciously. "
    "Format responses with clear sections when appropriate. Be concise but thorough."
)


def _get_session() -> requests.Session:
    session = requests.Session()
    proxy = os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    if proxy:
        session.proxies = {"http": proxy, "https": proxy}
    return session


def call_llama(messages: list, max_tokens: int = 600) -> str:
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY not configured. Please check your .env file."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,
        "stream": False,
    }

    try:
        session = _get_session()
        resp = session.post(GROQ_API_URL, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except requests.exceptions.ConnectionError:
        return (
            "NETWORK_ERROR: Cannot reach the Groq API.\n\n"
            "Troubleshooting steps:\n"
            "1. Check your internet connection is active\n"
            "2. Open a browser and visit console.groq.com to confirm access\n"
            "3. If on a university/work network, you may need a proxy — "
            "add HTTP_PROXY=http://your-proxy:port to the .env file\n"
            "4. A firewall may be blocking outbound HTTPS connections to api.groq.com"
        )
    except requests.exceptions.Timeout:
        return (
            "TIMEOUT: The model took too long to respond. "
            "Please try again."
        )
    except requests.exceptions.HTTPError:
        if resp.status_code == 401:
            return "UNAUTHORIZED (401): Your Groq API key is invalid or expired. Check GROQ_API_KEY in .env."
        if resp.status_code == 429:
            return "RATE LIMITED (429): Too many requests. Please wait a moment and try again."
        return f"API error ({resp.status_code}): {resp.text[:300]}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    user_message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not user_message:
        return jsonify({"error": "Message is empty."}), 400

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history[-12:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    reply = call_llama(messages, max_tokens=700)
    return jsonify({"response": reply, "timestamp": datetime.now().isoformat()})


@app.route("/api/threat-analysis", methods=["POST"])
def threat_analysis():
    data = request.get_json(force=True)
    threat = (data.get("threat") or "").strip()

    if not threat:
        return jsonify({"error": "No threat specified."}), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Give a structured cybersecurity analysis of: **{threat}**\n\n"
                "Use these sections:\n"
                "1. What It Is\n"
                "2. How It Works\n"
                "3. Warning Signs\n"
                "4. Prevention Measures\n"
                "5. How to Respond if Affected\n\n"
                "Be practical and clear."
            ),
        },
    ]

    reply = call_llama(messages, max_tokens=900)
    return jsonify({"analysis": reply, "threat": threat})


@app.route("/api/quiz", methods=["GET"])
def quiz():
    topic = (request.args.get("topic") or "general cybersecurity").strip()

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Create a cybersecurity quiz question about: {topic}\n\n"
                "Respond ONLY with valid JSON in this exact format:\n"
                '{"question": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "..."}, '
                '"correct": "A", "explanation": "..."}\n\n'
                "No extra text, just the JSON object."
            ),
        },
    ]

    raw = call_llama(messages, max_tokens=350)

    try:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            quiz_data = json.loads(match.group())
            return jsonify(quiz_data)
    except (json.JSONDecodeError, AttributeError):
        pass

    return jsonify({"raw": raw, "parse_error": True})


@app.route("/api/security-tip", methods=["GET"])
def security_tip():
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                "Give one specific, actionable cybersecurity tip for today. "
                "Format: start with a short bold title (e.g. **Use a Password Manager**), "
                "then 2-3 sentences explaining what to do and why it matters. Max 80 words."
            ),
        },
    ]
    tip = call_llama(messages, max_tokens=150)
    return jsonify({"tip": tip, "date": datetime.now().strftime("%B %d, %Y")})


@app.route("/api/analyze-url", methods=["POST"])
def analyze_url():
    data = request.get_json(force=True)
    url = (data.get("url") or "").strip()

    if not url:
        return jsonify({"error": "No URL provided."}), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Analyze this URL for phishing and security risks based on its structure only "
                f"(do not visit it): {url}\n\n"
                "Check for: suspicious domain patterns, typosquatting, unusual TLDs, "
                "excessive subdomains, misleading paths, URL shorteners, and other red flags. "
                "Give a Risk Level (Low/Medium/High/Critical) and list specific findings."
            ),
        },
    ]

    reply = call_llama(messages, max_tokens=450)
    return jsonify({"analysis": reply, "url": url})


@app.route("/api/explain-cve", methods=["POST"])
def explain_cve():
    data = request.get_json(force=True)
    cve = (data.get("cve") or "").strip()

    if not cve:
        return jsonify({"error": "No CVE provided."}), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Explain the vulnerability {cve} in plain language. Include: "
                "what software/system is affected, what an attacker can do with it, "
                "the CVSS severity, and what patches or mitigations exist. "
                "Keep it understandable for a non-expert audience."
            ),
        },
    ]

    reply = call_llama(messages, max_tokens=500)
    return jsonify({"explanation": reply, "cve": cve})


@app.route("/api/status", methods=["GET"])
def status():
    """Quick connectivity check used by the frontend on page load."""
    if not GROQ_API_KEY:
        return jsonify({"ok": False, "reason": "GROQ_API_KEY missing in .env"})
    try:
        session = _get_session()
        r = session.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            timeout=10,
        )
        if r.status_code == 200:
            return jsonify({"ok": True, "user": "Groq API connected"})
        if r.status_code == 401:
            return jsonify({"ok": False, "reason": "Invalid Groq API key (401)"})
        return jsonify({"ok": False, "reason": f"Groq returned {r.status_code}"})
    except requests.exceptions.ConnectionError:
        return jsonify({"ok": False, "reason": "Cannot reach api.groq.com — check internet / proxy"})
    except Exception as e:
        return jsonify({"ok": False, "reason": str(e)})


if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  CyberGuard AI — Cybersecurity Advisory System")
    print("  Powered by Meta Llama via Groq")
    print("=" * 55)
    print(f"  Running at: http://127.0.0.1:5000")
    print("=" * 55 + "\n")
    app.run(debug=True, port=5000)
