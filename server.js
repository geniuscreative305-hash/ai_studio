/**
 * AuraStudio: Backend Server (Node.js + Express)
 * Provides static hosting and secure server-side Google Gemini API (Imagen 3) Proxy
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    engine: 'Google Gemini 2.5 + Imagen 3',
    hasKey: Boolean(GEMINI_API_KEY),
  });
});

// Proxy Generate endpoint (Server-side API execution)
app.post('/api/generate', async (req, res) => {
  try {
    const { poseDataUrl, personDataUrl, outfitDataUrl, lighting, ratio, bgMode, bgColor, userApiKey } = req.body;
    const key = userApiKey || GEMINI_API_KEY;

    if (!key) {
      return res.status(400).json({
        error: 'API Key Gemini belum dikonfigurasi di file .env server atau di form settings.',
      });
    }

    const bgDesc = bgMode === 'solid' ? `solid studio background ${bgColor || '#0A0A0A'}` : 'isolated transparent background with clean alpha';
    const synthesizedPrompt = `Ultra-realistic commercial high-fashion studio photography, full portrait, professional ${lighting || 'softbox'} lighting, delicate catchlights in eyes, pore-level natural skin texture, ${bgDesc}, 8k resolution photograph, editorial magazine quality.`;

    const imagenEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(key)}`;

    const response = await fetch(imagenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: synthesizedPrompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: ratio || '1:1',
          outputMimeType: 'image/jpeg',
          personGeneration: 'ALLOW_ADULT',
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errJson.error?.message || `Gemini API Status: ${response.status}`,
      });
    }

    const data = await response.json();
    const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Bytes) {
      return res.status(500).json({ error: 'Tidak ada data gambar yang dikembalikan oleh Imagen 3' });
    }

    res.json({
      success: true,
      imageUrl: `data:image/jpeg;base64,${base64Bytes}`,
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
