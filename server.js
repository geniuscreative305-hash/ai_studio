/**
 * AuraStudio: Backend Server (Node.js + Express)
 * Provides static hosting and secure server-side OpenAI API Proxy
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    engine: 'OpenAI GPT-4o Vision + DALL-E 3',
    hasKey: Boolean(OPENAI_API_KEY),
  });
});

// Proxy Generate endpoint (Server-side API execution)
app.post('/api/generate', async (req, res) => {
  try {
    const { poseDataUrl, personDataUrl, outfitDataUrl, lighting, ratio, bgMode, bgColor, userApiKey } = req.body;
    const key = userApiKey || OPENAI_API_KEY;

    if (!key) {
      return res.status(400).json({
        error: 'API Key OpenAI belum dikonfigurasi di file .env server atau di form settings.',
      });
    }

    // Stage 1: GPT-4o Vision analysis
    const gptPrompt = `You are a high-fashion photography director. Analyze the 3 provided reference images:
1. POSE: Match exact posture, body angle, hand positions, and camera framing.
2. PERSON: Preserve exact facial bone structure, eyes, lips, jawline, skin tone, and hair.
3. OUTFIT: Recreate this exact garment, fabric texture, cut, and colors.
Target Lighting: ${lighting || 'commercial softbox'} studio lighting.
Background: ${bgMode === 'solid' ? `Solid studio color ${bgColor || '#0A0A0A'}` : 'Clean transparent studio background'}.
Synthesize an ultra-detailed, single-paragraph photographic DALL-E 3 prompt for a photorealistic 8k editorial studio portrait. Output ONLY the raw prompt string.`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: gptPrompt },
              { type: 'image_url', image_url: { url: poseDataUrl } },
              { type: 'image_url', image_url: { url: personDataUrl } },
              { type: 'image_url', image_url: { url: outfitDataUrl } },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!gptResponse.ok) {
      const gptErr = await gptResponse.json();
      return res.status(gptResponse.status).json({ error: gptErr.error?.message || 'GPT-4o Vision failed' });
    }

    const gptJson = await gptResponse.json();
    const synthesizedPrompt = gptJson.choices[0]?.message?.content || 'Editorial studio fashion portrait';

    // Stage 2: DALL-E 3 rendering
    let dalleSize = '1024x1024';
    if (ratio === '9:16') dalleSize = '1024x1792';

    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `${synthesizedPrompt}, 8k photography, commercial studio portrait, award winning lighting, high fidelity skin texture, no artifacts, no extra limbs`,
        n: 1,
        size: dalleSize,
        quality: 'hd',
        style: 'natural',
      }),
    });

    if (!dalleResponse.ok) {
      const dalleErr = await dalleResponse.json();
      return res.status(dalleResponse.status).json({ error: dalleErr.error?.message || 'DALL-E 3 failed' });
    }

    const dalleJson = await dalleResponse.json();
    const imageUrl = dalleJson.data[0]?.url;

    res.json({
      success: true,
      imageUrl,
      prompt: synthesizedPrompt,
    });
  } catch (error) {
    console.error('Server generation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ AuraStudio server berjalan di http://localhost:${PORT}`);
});
