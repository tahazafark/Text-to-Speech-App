import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Request, Response } from 'express';

const client = new TextToSpeechClient();

export const synthesize = async (req: Request, res: Response) => {
  try {
    const { text, languageCode, voiceName } = req.body;
    console.log('Backend: Received request:', { text, languageCode, voiceName });

    const request = {
      input: { text },
      voice: {
        languageCode: languageCode || 'en-US',
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    if (!response?.audioContent) {
      throw new Error('No audio content received from Google Cloud');
    }

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);

  } catch (error) {
    console.error("Backend: Error in Text-to-Speech:", error);
    res.status(500).json({ 
      error: "Failed to convert text to speech",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};