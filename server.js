const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// Pass GEMINI_API_KEY explicitly to the SDK constructor
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate Limiter
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later.' }
});

// Authentication Middleware checking against CHAT_API_SECRET
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.CHAT_API_SECRET || 'fallback-secret-key';

  if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
};

app.post('/api/v1/chat', chatLimiter, authenticateRequest, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message field is required and must be a string' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
    });

    return res.json({
      status: 'success',
      reply: response.text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Failed to generate response from AI service.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
