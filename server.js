/**
 * SunoSahi AI - Main Server
 * Express Server for Voice Agent Hackathon Submission
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const gnaniService = require('./gnani_service');
const confidenceEngine = require('./engine/confidence_engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup in-memory audio upload handling (max 15MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Status & Gnani Connection Healthcheck
app.get('/api/status', async (req, res) => {
  const result = await gnaniService.testConnection();
  res.json({
    status: 'ok',
    gnaniConfigured: gnaniService.isConfigured(),
    gnaniStatus: result,
    engine: {
      name: 'SunoSahi AI',
      models: {
        stt: 'Gnani Prisma v3.0 (Indic-Auto Code-Mixed)',
        tts: 'Gnani Timbre v2.5 / v3.0 (Nalini Voice)',
        nlu: 'SunoSahi Confidence-Aware Disambiguation Engine'
      }
    }
  });
});

// 2. Set / Update API Key dynamically
app.post('/api/settings/key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid API key provided' });
  }

  const trimmed = apiKey.trim();
  gnaniService.setApiKey(trimmed);

  // Attempt to persist to .env file
  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GNANI_API_KEY=')) {
        envContent = envContent.replace(/GNANI_API_KEY=.*/g, `GNANI_API_KEY=${trimmed}`);
      } else {
        envContent += `\nGNANI_API_KEY=${trimmed}\n`;
      }
    } else {
      envContent = `GNANI_API_KEY=${trimmed}\nGNANI_STT_URL=https://api.vachana.ai/stt/v3\nGNANI_TTS_URL=https://api.vachana.ai/api/v1/tts/inference\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (err) {
    console.warn('Could not write to .env:', err.message);
  }

  return res.json({
    success: true,
    message: 'Gnani API Key updated successfully',
    configured: gnaniService.isConfigured()
  });
});

// 3. Audio Transcription (Gnani Prisma STT)
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    const lang = req.body.language || 'indic-auto';
    const filename = req.file.originalname || 'speech.wav';

    const result = await gnaniService.transcribeAudio(req.file.buffer, filename, lang);
    return res.json(result);
  } catch (err) {
    console.error('Transcription route error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Text-to-Speech Synthesis (Gnani Timbre TTS)
app.post('/api/synthesize', async (req, res) => {
  try {
    const { text, voice, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required for TTS' });
    }

    const result = await gnaniService.synthesizeSpeech(text, voice, language);
    return res.json(result);
  } catch (err) {
    console.error('Synthesize route error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Full Dialogue Turn Processing (Confidence Engine + Auto Voice Synthesis)
app.post('/api/dialogue', async (req, res) => {
  try {
    const { sessionId = 'default', text, acousticConfidence = 92, targetLang = 'hi-IN' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Customer text is required' });
    }

    // Process through SunoSahi Confidence & Disambiguation Engine
    const dialogueResult = confidenceEngine.processUtterance(sessionId, text, Number(acousticConfidence) || 92);
    const agentReply = dialogueResult.turn.agentReply;

    // Automatically synthesize voice reply using Gnani Timbre
    let audioData = null;
    try {
      const ttsResult = await gnaniService.synthesizeSpeech(agentReply, null, targetLang);
      if (ttsResult.success && ttsResult.audioBase64) {
        audioData = {
          audioBase64: ttsResult.audioBase64,
          contentType: ttsResult.contentType
        };
      }
    } catch (synthErr) {
      console.warn('TTS generation warning:', synthErr.message);
    }

    return res.json({
      success: true,
      turn: dialogueResult.turn,
      session: dialogueResult.session,
      audio: audioData,
      useWebSpeechFallback: !audioData
    });
  } catch (err) {
    console.error('Dialogue route error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Reset Session
app.post('/api/session/reset', (req, res) => {
  const { sessionId = 'default' } = req.body;
  const newSession = confidenceEngine.resetSession(sessionId);
  return res.json({ success: true, session: newSession });
});

// 7. Get Current Session
app.get('/api/session', (req, res) => {
  const sessionId = req.query.sessionId || 'default';
  const session = confidenceEngine.getOrCreateSession(sessionId);
  return res.json({ success: true, session });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`   🚀 SunoSahi AI Voice Agent Server Running!         `);
  console.log(`   🌐 URL: http://localhost:${PORT}                   `);
  console.log(`   🎙️  Gnani Prisma STT: ${gnaniService.sttUrl}       `);
  console.log(`   🔊 Gnani Timbre TTS: ${gnaniService.ttsUrl}       `);
  console.log(`   🛡️  Confidence-Aware Disambiguation Engine Ready   `);
  console.log(`=======================================================`);
});
