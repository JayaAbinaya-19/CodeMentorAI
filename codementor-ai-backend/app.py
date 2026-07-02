import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from google import genai
from google.genai import types
import time

def call_gemini_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return response
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                time.sleep(2 * (attempt + 1))  # wait a bit longer each retry
                continue
            raise  # give up after max_retries, or if it's a different kind of error

load_dotenv()
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///codementor.db"
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    language = db.Column(db.String(20))
    code = db.Column(db.Text)
    result = db.Column(db.Text)  # the AI's JSON response, stored as a string
    created_at = db.Column(db.DateTime, server_default=db.func.now())

with app.app_context():
    db.create_all()

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    new_user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)  # NEVER store plain text passwords
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"id": new_user.id, "name": new_user.name, "email": new_user.email}), 201



@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password_hash, password):
        return jsonify({"id": user.id, "name": user.name, "email": user.email}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")
    user = User.query.filter_by(email=email).first()

    # Real apps: generate a secure token, email a reset link, expire it after ~15 min.
    # For now, we simulate that by printing to the terminal.
    if user:
        print(f"[DEV] Password reset requested for {email} (in production: email a reset link)")

    # Always return the SAME message whether or not the email exists.
    # Otherwise, attackers could use this form to discover which emails are registered.
    return jsonify({"message": "If that email exists, a reset link has been sent."}), 200
@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    code = data.get("code")
    language = data.get("language")
    user_id = data.get("user_id")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    prompt = f"""Analyze the following {language} code.

Tasks:
1. Identify syntax errors.
2. Explain errors in simple language.
3. Suggest corrections.
4. Provide corrected code.
5. Generate 3 interview questions related to the concepts used.
6. Estimate the time and space complexity of the corrected code.
7. Score the code's quality out of 100, rating readability, efficiency, and naming conventions.

Code:
{code}

Respond ONLY with valid JSON in this exact structure:
{{
  "errors": ["short description of each error found"],
  "explanation": "a plain-language explanation of what went wrong",
  "suggestions": ["specific suggested fixes"],
  "corrected_code": "the full corrected code",
  "interview_questions": ["3 interview questions related to this code"],
  "complexity": {{
    "time_complexity": "e.g. O(n)",
    "space_complexity": "e.g. O(1)",
    "note": "one sentence explaining why"
  }},
  "quality": {{
    "score": 82,
    "readability": "Good",
    "efficiency": "Moderate",
    "naming_convention": "Excellent"
  }}
}}"""
    try:
        response = call_gemini_with_retry(prompt)
        result = json.loads(response.text)

        if user_id:
            submission = Submission(
                user_id=user_id,
                language=language,
                code=code,
                result=json.dumps(result)
            )
            db.session.add(submission)
            db.session.commit()

        return jsonify(result), 200

    except json.JSONDecodeError:
        return jsonify({"error": "AI response wasn't valid JSON, try again"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    topic = data.get("topic")
    language = data.get("language", "Python")
    company = data.get("company", "General")

    company_context = ""
    if company != "General":
        company_styles = {
            "TCS": "TCS typically asks straightforward conceptual questions, basic syntax, and simple logic problems suitable for freshers.",
            "Infosys": "Infosys focuses on logical reasoning, basic data structures, and fundamental OOP concepts.",
            "Wipro": "Wipro emphasizes aptitude-style coding questions, string manipulation, and array operations.",
            "Cognizant": "Cognizant asks practical, scenario-based questions about real-world coding situations.",
            "Accenture": "Accenture focuses on pseudocode, algorithm thinking, and conceptual understanding over syntax.",
            "Google": "Google asks challenging algorithmic problems requiring deep understanding of time/space complexity and elegant solutions.",
            "Amazon": "Amazon emphasizes leadership principles in coding — optimal solutions, edge cases, and scalability thinking.",
            "Microsoft": "Microsoft focuses on problem-solving clarity, clean code, and explaining your thought process.",
            "Meta": "Meta asks graph/tree problems, system design thinking, and optimized algorithmic solutions."
        }
        company_context = f"\n\nImportant: Tailor these questions specifically to {company}'s interview style. {company_styles.get(company, '')}"

    prompt = f"""Generate a 5-question multiple choice quiz about "{topic}" in {language} programming.{company_context}
Each question should test real understanding, not just memorization.

Respond ONLY with valid JSON in this exact structure:
{{
  "topic": "{topic}",
  "questions": [
    {{
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0,
      "explanation": "why this answer is correct, in simple language"
    }}
  ]
}}"""

    try:
        response = call_gemini_with_retry(prompt)
        return jsonify(json.loads(response.text)), 200
    except json.JSONDecodeError:
        return jsonify({"error": "AI response wasn't valid JSON, try again"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/explain", methods=["POST"])
def explain_concept():
    data = request.get_json()
    concept = data.get("concept")
    language = data.get("language", "Python")

    if not concept:
        return jsonify({"error": "Please provide a concept"}), 400

    prompt = f"""Explain the programming concept "{concept}" in {language} to a beginner student.

Respond ONLY with valid JSON in this exact structure:
{{
  "concept": "{concept}",
  "simple_explanation": "a beginner-friendly explanation, 3-5 sentences",
  "real_world_analogy": "a relatable real-world comparison",
  "example_code": "a short, well-commented code example demonstrating it",
  "common_mistakes": ["mistake 1 beginners make", "mistake 2"]
}}"""

    try:
        response = call_gemini_with_retry(prompt)
        return jsonify(json.loads(response.text)), 200
    except json.JSONDecodeError:
        return jsonify({"error": "AI response wasn't valid JSON, try again"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500   
@app.route("/api/history/<int:user_id>", methods=["GET"])
def get_history(user_id):
    submissions = Submission.query.filter_by(user_id=user_id).order_by(Submission.created_at.desc()).all()

    history = [
        {
            "id": s.id,
            "language": s.language,
            "code": s.code,
            "result": json.loads(s.result),
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in submissions
    ]

    return jsonify(history), 200
@app.route("/api/learning-tips/<int:user_id>", methods=["GET"])
def learning_tips(user_id):
    submissions = Submission.query.filter_by(user_id=user_id).order_by(Submission.created_at.desc()).limit(10).all()

    if not submissions:
        return jsonify({"message": "Not enough history yet — analyze a few more submissions first."}), 200

    error_summary = []
    for s in submissions:
        try:
            result = json.loads(s.result)
            error_summary.append(f"[{s.language}] " + "; ".join(result.get("errors", [])))
        except Exception:
            continue

    combined_errors = "\n".join(error_summary)

    prompt = f"""A student has submitted code for analysis multiple times. Here are the errors found across their recent submissions:

{combined_errors}

Based on these patterns, identify what concepts this student struggles with most, and recommend specific topics to study.

Respond ONLY with valid JSON in this exact structure:
{{
  "pattern_summary": "a short, encouraging summary of the patterns you notice (2-3 sentences)",
  "recommended_topics": ["topic 1", "topic 2", "topic 3"]
}}"""

    try:
        response = call_gemini_with_retry(prompt)
        return jsonify(json.loads(response.text)), 200
    except json.JSONDecodeError:
        return jsonify({"error": "AI response wasn't valid JSON, try again"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    submissions = Submission.query.filter_by(user_id=user_id).all()

    language_counts = {}
    scores = []

    for s in submissions:
        language_counts[s.language] = language_counts.get(s.language, 0) + 1
        try:
            result = json.loads(s.result)
            score = result.get("quality", {}).get("score")
            if score is not None:
                scores.append(score)
        except Exception:
            continue

    average_score = round(sum(scores) / len(scores), 1) if scores else None

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "total_submissions": len(submissions),
        "language_counts": language_counts,
        "average_score": average_score
    }), 200
@app.route("/api/interview/generate", methods=["POST"])
def generate_problem():
    data = request.get_json()
    topic = data.get("topic")
    difficulty = data.get("difficulty")
    language = data.get("language")

    prompt = f"""Generate a {difficulty} difficulty coding interview problem about {topic} for {language}.

Respond ONLY with valid JSON in this exact structure:
{{
  "title": "Problem title",
  "difficulty": "{difficulty}",
  "topic": "{topic}",
  "problem_statement": "Full problem description with clear requirements",
  "input_format": "Description of input format",
  "output_format": "Description of expected output",
  "constraints": ["constraint 1", "constraint 2"],
  "examples": [
    {{
      "input": "example input",
      "output": "expected output",
      "explanation": "why this is the output"
    }}
  ],
  "hints": ["hint 1 (subtle)", "hint 2 (more direct)"]
}}"""

    try:
        response = call_gemini_with_retry(prompt)
        return jsonify(json.loads(response.text)), 200
    except json.JSONDecodeError:
        return jsonify({"error": "AI response wasn't valid JSON, try again"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/interview/evaluate", methods=["POST"])
def evaluate_solution():
    data = request.get_json()
    problem = data.get("problem")
    solution = data.get("solution")
    language = data.get("language")

    prompt = f"""A student was given this coding interview problem:

Title: {problem.get("title")}
Problem: {problem.get("problem_statement")}
Expected output format: {problem.get("output_format")}

Their {language} solution:
{solution}

Evaluate this solution as a coding interviewer would.

Respond ONLY with valid JSON in this exact structure:
{{
  "verdict": "Accepted" or "Wrong Answer" or "Incomplete",
  "score": 85,
  "correctness": "Is the logic correct? Does it handle all cases?",
  "time_complexity": "O(...) with explanation",
  "space_complexity": "O(...) with explanation",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "optimal_approach": "Brief description of the most optimal solution approach",
  "interviewer_feedback": "Overall feedback as a senior engineer would give it — honest but constructive"
}}"""

    try:
        response = call_gemini_with_retry(prompt)
        return jsonify(json.loads(response.text)), 200
    except json.JSONDecodeError:
        return jsonify({"error": "AI response wasn't valid JSON, try again"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True, port=5000)