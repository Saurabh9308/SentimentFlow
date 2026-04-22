import os
import joblib
import pandas as pd
import sys

# CRITICAL: Force import torch at the very top
try:
    import torch
except ImportError:
    print("Torch not found in venv. Please run: pip install torch")

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)

# --- Robust CORS configuration ---
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=False,
)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "linear_svm_model.pkl")
VEC_PATH = os.path.join(BASE_DIR, "models", "tfidf_vectorizer.pkl")

# Initialize global variables
sentiment_model = None
vectorizer = None
emotion_pipe = None

def load_resources():
    global sentiment_model, vectorizer, emotion_pipe
    try:
        print("--- Loading Sentiment Models ---")
        sentiment_model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VEC_PATH)
        
        print("--- Loading Emotion Transformer ---")

        device = 0 if torch.cuda.is_available() else -1

        emotion_pipe = pipeline(
            "text-classification", 
            model="bhadresh-savani/distilbert-base-uncased-emotion", 
            top_k=None,
            device=-1 
        )
        print("✅ All systems go!")
    except Exception as e:
        print(f"❌ Error during startup: {str(e)}")

# Load models once when starting
load_resources()

def format_label(val):
    v = str(val).lower()
    return "Positive" if v in ["4", "1", "positive"] else "Negative"

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    # Handle preflight
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    if not emotion_pipe:
        return jsonify({"error": "Models not loaded on server"}), 500
        
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "Empty text"}), 400

        # Sentiment
        vec_text = vectorizer.transform([text])
        s_raw = sentiment_model.predict(vec_text)[0]
        sentiment = format_label(s_raw)

        # Emotion
        results = emotion_pipe(text)[0]
        sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)

        return jsonify({
            "sentiment": sentiment,
            "top_emotion": sorted_results[0]['label'],
            "breakdown": sorted_results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "API is active"

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False) # use_reloader=False prevents double loading on Macs