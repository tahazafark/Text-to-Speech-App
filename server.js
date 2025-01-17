require('dotenv').config();
const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Create the client
const client = new textToSpeech.TextToSpeechClient();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

app.post("/api/synthesize", async (req, res) => {
  try {
    const { text, languageCode, voiceName } = req.body;
    console.log('Backend: Received request:', { text, languageCode, voiceName });

    // Function to split text into chunks
    const splitTextIntoChunks = (text, maxBytes = 4800) => {
      const chunks = [];
      let currentChunk = '';
      
      const sentences = text.split(/([।.!?]+)/g);
      
      for (const sentence of sentences) {
        const potentialChunk = currentChunk + sentence;
        if (Buffer.from(potentialChunk).length <= maxBytes) {
          currentChunk = potentialChunk;
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      
      if (currentChunk) chunks.push(currentChunk.trim());
      return chunks;
    };

    const textChunks = splitTextIntoChunks(text);
    console.log(`Backend: Split text into ${textChunks.length} chunks`);

    const audioBuffers = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`Backend: Processing chunk ${i + 1}/${textChunks.length}, length: ${chunk.length}`);
      
      const request = {
        input: { text: chunk },
        voice: {
          languageCode: languageCode || 'en-US',
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0,
        },
      };

      const [response] = await client.synthesizeSpeech(request);
      
      if (!response?.audioContent) {
        throw new Error(`No audio content received for chunk ${i + 1}`);
      }

      audioBuffers.push(Buffer.from(response.audioContent));
    }

    const combinedAudio = Buffer.concat(audioBuffers);
    console.log('Backend: Successfully combined all audio chunks');

    res.set('Content-Type', 'audio/mpeg');
    res.send(combinedAudio);

  } catch (error) {
    console.error("Backend: Error in Text-to-Speech:", error);
    res.status(500).json({ 
      error: "Failed to convert text to speech",
      details: error.message
    });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
