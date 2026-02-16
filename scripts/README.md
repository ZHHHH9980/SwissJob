# Local Whisper Transcription Server

This directory contains a local Whisper transcription service that can be used as an alternative to the OpenAI Whisper API.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

Note: The first time you run the server, Whisper will download the model files (~140MB for base model).

## Usage

Start the server:
```bash
python whisper-server.py
```

Options:
- `--port PORT`: Port to run the server on (default: 9000)
- `--model MODEL`: Whisper model to use (default: base)
  - Available models: tiny, base, small, medium, large
  - Larger models are more accurate but slower

Example with custom settings:
```bash
python whisper-server.py --port 9000 --model small
```

## Configuration

To use the local Whisper server in the application, set these environment variables in your `.env` file:

```
WHISPER_MODE=local
WHISPER_API_URL=http://localhost:9000
```

## API Endpoints

### POST /transcribe
Transcribe an audio file to text.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (audio file)

**Response:**
```json
{
  "text": "Transcribed text here..."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "model": "base"
}
```

## Model Comparison

| Model  | Size  | Speed | Accuracy |
|--------|-------|-------|----------|
| tiny   | ~39MB | Fast  | Basic    |
| base   | ~74MB | Fast  | Good     |
| small  | ~244MB| Medium| Better   |
| medium | ~769MB| Slow  | Great    |
| large  | ~1550MB| Very Slow | Best |

For most use cases, the `base` or `small` model provides a good balance of speed and accuracy.
