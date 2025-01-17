import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Request, Response } from 'express';

// Initialize the client with credentials
const client = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, languageCode, voiceName } = req.body;

    const request = {
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    res.setHeader('Content-Type', 'audio/mp3');
    res.send(audioContent);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
}