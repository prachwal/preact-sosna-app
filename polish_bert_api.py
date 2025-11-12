#!/usr/bin/env python3
"""
Polish Language Embedding API using radlab/polish-sts-v2
"""
import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, origins=[
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:5173", 
    "http://127.0.0.1:3000"
    ])

# Global model variable
model = None

def load_model():
    """Load the Polish BERT model"""
    global model
    try:
        logger.info("Loading Polish BERT model: radlab/polish-bi-encoder-mean...")
        model = SentenceTransformer('radlab/polish-bi-encoder-mean')
        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    if model is None:
        return jsonify({"status": "error", "message": "Model not loaded"}), 503
    return jsonify({
        "status": "healthy",
        "model": "radlab/polish-bi-encoder-mean",
        "language": "polish"
    })

@app.route('/embed', methods=['POST'])
def embed():
    """Generate embeddings for input Polish texts"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    try:
        data = request.get_json()
        if not data or 'inputs' not in data:
            return jsonify({"error": "Missing 'inputs' field"}), 400

        inputs = data['inputs']
        if not isinstance(inputs, list):
            return jsonify({"error": "'inputs' must be a list"}), 400

        logger.info(f"Processing {len(inputs)} Polish inputs")

        # Generate embeddings
        embeddings = model.encode(inputs, convert_to_tensor=False)

        # Convert to list for JSON serialization
        embeddings_list = embeddings.tolist() if hasattr(embeddings, 'tolist') else embeddings

        return jsonify({
            "embeddings": embeddings_list,
            "model": "radlab/polish-bi-encoder-mean",
            "language": "polish",
            "dimension": len(embeddings_list[0]) if embeddings_list else 0
        })

    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    """Get model information"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    return jsonify({
        "model": "radlab/polish-bi-encoder-mean",
        "language": "polish",
        "max_seq_length": model.max_seq_length,
        "dimension": model.get_sentence_embedding_dimension(),
        "device": str(model.device),
        "description": "Polish sentence embeddings model - bi-encoder with mean pooling"
    })

@app.route('/similarity', methods=['POST'])
def similarity():
    """Calculate similarity between two Polish texts"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    try:
        data = request.get_json()
        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({"error": "Missing 'text1' and 'text2' fields"}), 400

        text1 = data['text1']
        text2 = data['text2']

        # Generate embeddings
        emb1 = model.encode([text1], convert_to_tensor=False)[0]
        emb2 = model.encode([text2], convert_to_tensor=False)[0]

        # Calculate cosine similarity
        similarity_score = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

        return jsonify({
            "similarity": float(similarity_score),
            "model": "radlab/polish-bi-encoder-mean",
            "language": "polish"
        })

    except Exception as e:
        logger.error(f"Error calculating similarity: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Try to load model on startup
    if load_model():
        logger.info("Starting Polish BERT API server on port 8080")
        app.run(host='0.0.0.0', port=8080, debug=False)
    else:
        logger.error("Failed to load model, exiting")
        exit(1)