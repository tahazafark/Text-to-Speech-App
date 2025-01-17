# Text-to-Speech API

This is a Node.js backend API that converts text to speech using Google Cloud Text-to-Speech API.

## Setup

1. Place your Google Cloud credentials JSON file in the root directory as `google-credentials.json`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## API Usage

Send a POST request to `/api/synthesize` with the following JSON body:

```json
{
  "text": "Text to convert to speech",
  "languageCode": "en-US",
  "voiceName": "en-US-Standard-A"
}
```

The API will return an MP3 file containing the synthesized speech.

### Parameters

- `text` (required): The text to convert to speech
- `languageCode` (optional): The language code (defaults to "en-US")
- `voiceName` (optional): The voice name to use (defaults to "en-US-Standard-A")