#!/usr/bin/env python3
"""
Local Whisper Transcription Server

A simple Flask server that provides audio transcription using OpenAI's Whisper model.
This allows you to run transcription locally without using the OpenAI API.

Usage:
    python whisper-server.py [--port PORT] [--model MODEL]

Options:
    --port PORT      Port to run the server on (default: 9000)
    --model MODEL    Whisper model to use (default: base)
                     Options: tiny, base, small, medium, large

Requirements:
    - Python 3.8+
    - See requirements.txt for dependencies
"""

import argparse
import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper

app = Flask(__name__)
CORS(app)

# Global model variable
model = None

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file to text."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name

        # Transcribe
        result = model.transcribe(temp_path)

        # Clean up
        os.unlink(temp_path)

        return jsonify({'text': result['text']})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'model': args.model})

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Local Whisper Transcription Server')
    parser.add_argument('--port', type=int, default=9000, help='Port to run server on')
    parser.add_argument('--model', type=str, default='base',
                        choices=['tiny', 'base', 'small', 'medium', 'large'],
                        help='Whisper model to use')
    args = parser.parse_args()

    print(f"Loading Whisper model '{args.model}'...")
    model = whisper.load_model(args.model)
    print(f"Model loaded successfully!")

    print(f"Starting server on http://localhost:{args.port}")
    app.run(host='0.0.0.0', port=args.port, debug=False)
