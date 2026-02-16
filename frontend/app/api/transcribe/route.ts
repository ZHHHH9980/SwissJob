import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const WHISPER_MODE = process.env.WHISPER_MODE || 'none';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:9000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    let transcription: string;

    switch (WHISPER_MODE) {
      case 'none':
        return NextResponse.json(
          { error: 'Whisper transcription is disabled' },
          { status: 503 }
        );

      case 'api':
        if (!OPENAI_API_KEY) {
          return NextResponse.json(
            { error: 'OpenAI API key not configured' },
            { status: 500 }
          );
        }

        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        const response = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });
        transcription = response.text;
        break;

      case 'local':
        const localFormData = new FormData();
        localFormData.append('file', audioFile);

        const localResponse = await fetch(`${WHISPER_API_URL}/transcribe`, {
          method: 'POST',
          body: localFormData,
        });

        if (!localResponse.ok) {
          throw new Error('Local Whisper service error');
        }

        const localData = await localResponse.json();
        transcription = localData.text;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid WHISPER_MODE configuration' },
          { status: 500 }
        );
    }

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
