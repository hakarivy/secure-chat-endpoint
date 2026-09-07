const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Headers & Payload Size Limits
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate Limiting (30 requests per minute per IP)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later.' }
});

// Secret API Authentication
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.CHAT_API_SECRET || 'fallback-secret-key';

  if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
};

// Secure POST Endpoint
app.post('/api/v1/chat', chatLimiter, authenticateRequest, (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message field is required and must be a string' });
  }

  // Insert AI service/LLM API call here in the future
  return res.json({
    status: 'success',
    reply: `Cloud server received: "${message}"`,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));