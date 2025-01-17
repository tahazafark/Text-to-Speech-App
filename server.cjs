import dotenv from 'dotenv';
dotenv.config();  // Load environment variables from the .env file
import express from "express";
import bodyParser from "body-parser";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";  // Using ES module import
import fs from "fs";
import util from "util";

const app = express();
const port = 3000; // Choose your preferred port

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Load Google Cloud credentials from the environment variable
const client = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Credentials path from .env
});

// POST endpoint to handle text-to-speech requests
app.post("/api/text-to-speech", async (req, res) => {
  try {
    const { text, languageCode, voiceName, audioEncoding } = req.body;

    // Check if required fields are provided
    if (!text || !languageCode) {
      return res.status(400).json({ error: "Text and languageCode are required" });
    }

    // Set up the request payload for the Text-to-Speech API
    const request = {
      input: { text },
      voice: {
        languageCode, // e.g., "en-US"
        name: voiceName || `${languageCode}-Standard-A`, // Optional, default to Standard-A voice
      },
      audioConfig: {
        audioEncoding: audioEncoding || "MP3", // Default to MP3
      },
    };

    // Call the Google Cloud Text-to-Speech API
    const [response] = await client.synthesizeSpeech(request);

    // Generate a unique filename for the audio file
    const outputFileName = `output-${Date.now()}.mp3`;

    // Write the audio content to a file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputFileName, response.audioContent, "binary");

    // Send the MP3 file as a response
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `attachment; filename=${outputFileName}`,
    });
    res.send(response.audioContent);

    // Optionally, delete the file after sending (to avoid storing files on the server)
    fs.unlinkSync(outputFileName);
  } catch (error) {
    console.error("Error in Text-to-Speech:", error);
    res.status(500).json({ error: "Failed to convert text to speech" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});