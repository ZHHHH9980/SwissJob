from pathlib import Path
import os
import uuid

try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("Warning: faster-whisper not installed. Transcription service will not be available.")


class WhisperService:
    def __init__(self):
        if not WHISPER_AVAILABLE:
            self.model = None
            return

        model_size = os.getenv("WHISPER_MODEL", "base")
        device = os.getenv("WHISPER_DEVICE", "cpu")

        try:
            self.model = WhisperModel(model_size, device=device, compute_type="int8")
        except Exception as e:
            print(f"Error initializing Whisper model: {e}")
            self.model = None

    def transcribe(self, audio_path: str, language: str = "zh") -> str:
        """Transcribe audio file to text"""
        if not WHISPER_AVAILABLE or self.model is None:
            raise RuntimeError("Whisper service is not available. Please install faster-whisper.")

        try:
            segments, info = self.model.transcribe(
                audio_path,
                language=language,
                beam_size=5
            )

            transcript = ""
            for segment in segments:
                transcript += segment.text + " "

            return transcript.strip()
        except Exception as e:
            raise RuntimeError(f"Transcription failed: {str(e)}")

    def save_audio(self, file_content: bytes, filename: str) -> tuple[str, str]:
        """Save audio file to data/audio/ and return (file_path, file_id)"""
        audio_dir = Path("../data/audio")
        audio_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique ID
        file_id = str(uuid.uuid4())

        # Get file extension
        ext = Path(filename).suffix or ".wav"

        # Create unique filename
        unique_filename = f"{file_id}{ext}"
        file_path = audio_dir / unique_filename

        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)

        return str(file_path), file_id

    def is_available(self) -> bool:
        """Check if Whisper service is available"""
        return WHISPER_AVAILABLE and self.model is not None
