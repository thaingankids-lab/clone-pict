import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const ALLOWED_IMAGE_SIZES = new Set(['1K', '2K', '4K']);
const ALLOWED_BACKGROUNDS = new Set([
  'transparent',
  '#00FF00',
  '#FF00FF',
  '#0000FF',
  '#00FFFF',
  '#FFFF00',
  '#FFFFFF',
  '#000000',
]);
const IMAGE_MODEL = 'gemini-3.1-flash-image';

const getApiClient = (apiKey: unknown): GoogleGenAI | null => {
  if (typeof apiKey !== 'string' || !apiKey.trim()) return null;

  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'print-clone-rep-app',
      },
    },
  });
};

const getApiErrorMessage = (error: any): string => {
  const message = String(error?.message || error || '');

  if (/API key not valid|invalid api key|API_KEY_INVALID/i.test(message)) {
    return 'API key không hợp lệ hoặc không thuộc đúng dịch vụ Gemini API.';
  }

  if (/permission|forbidden|PERMISSION_DENIED|referer|referrer|restriction|restricted/i.test(message)) {
    return 'API key bị chặn bởi quyền hoặc giới hạn key. Hãy kiểm tra API restrictions/referrer restrictions.';
  }

  if (/quota|billing|RESOURCE_EXHAUSTED/i.test(message)) {
    return 'API key hợp lệ nhưng đang hết quota hoặc cần kiểm tra billing.';
  }

  if (/not found|not supported|model/i.test(message)) {
    return 'Model ảnh không khả dụng qua endpoint hiện tại. Hãy kiểm tra quyền Gemini API của key.';
  }

  return 'Không thể kết nối hoặc kiểm tra API key. Hãy thử lại sau.';
};

const listModelsForKey = async (apiKey: string): Promise<string[]> => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.error?.message || response.statusText || `HTTP ${response.status}`;
    throw new Error(detail);
  }

  return Array.isArray(payload.models)
    ? payload.models
        .map((model: any) => (typeof model?.name === 'string' ? model.name.replace('models/', '') : null))
        .filter(Boolean)
    : [];
};

const getQualityDescription = (quality: number): string => {
  if (quality <= 3) return 'basic cleanup, faster draft clone';
  if (quality <= 6) return 'balanced cleanup and detail reconstruction';
  if (quality <= 9) return 'high fidelity clone with crisp edges and strong detail recovery';
  return 'maximum effort 1:1 replica for final print output';
};

const clampQuality = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 8;
  return Math.min(10, Math.max(1, Math.round(parsed)));
};

const normalizeImageSize = (value: unknown): string => {
  const requested = typeof value === 'string' ? value.toUpperCase() : '1K';
  return ALLOWED_IMAGE_SIZES.has(requested) ? requested : '1K';
};

const normalizeBackground = (value: unknown): string => {
  const requested = typeof value === 'string' ? value.toUpperCase() : 'transparent';
  return ALLOWED_BACKGROUNDS.has(requested) ? requested : 'transparent';
};

const getBackgroundInstruction = (backgroundColor: string): string => {
  if (backgroundColor === 'transparent') {
    return `Background output:
- Prefer a true transparent PNG with a real alpha channel.
- The background must be fully transparent, not white, gray, black, checkerboard, or any solid color.
- Only the cloned artwork should remain visible.`;
  }

  return `Background output:
- Use one perfectly flat solid background color: ${backgroundColor}.
- Do not use gradients, shadows, texture, checkerboard, or transparency.
- Keep the artwork fully separated from the background so the user can manually remove this color in Photoshop if needed.`;
};

const extractImageBase64FromInteraction = (interaction: any): string | null => {
  const stack = [interaction];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;

    if (
      current.type === 'image' &&
      typeof current.data === 'string' &&
      current.data.length > 100
    ) {
      return current.data.includes(',') ? current.data.split(',').pop() || null : current.data;
    }

    if (typeof current.imageBytes === 'string' && current.imageBytes.length > 100) {
      return current.imageBytes;
    }

    if (typeof current.image_bytes === 'string' && current.image_bytes.length > 100) {
      return current.image_bytes;
    }

    if (typeof current.b64_json === 'string' && current.b64_json.length > 100) {
      return current.b64_json;
    }

    if (typeof current.data === 'string' && /^data:image\//.test(current.data)) {
      return current.data.split(',').pop() || null;
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        for (const item of value) stack.push(item);
      } else if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }

  return null;
};

const generateImage = async (
  ai: GoogleGenAI,
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  imageSize: string,
): Promise<string> => {
  const interaction = await ai.interactions.create({
    api_version: 'v1beta',
    model: IMAGE_MODEL,
    input: [
      {
        type: 'text',
        text: prompt,
      },
      {
        type: 'image',
        data: base64ImageData,
        mime_type: mimeType,
      },
    ],
    response_modalities: ['image'],
    response_format: {
      type: 'image',
      image_size: imageSize,
      mime_type: 'image/png',
    },
    response_mime_type: 'image/png',
    store: false,
  } as any);

  const imageBase64 = extractImageBase64FromInteraction(interaction);
  if (!imageBase64) {
    throw new Error('No image data found in the API response.');
  }

  return imageBase64;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/test-api-key', async (req, res) => {
    try {
      const apiKey = typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '';
      if (!apiKey) {
        return res.status(400).json({ error: 'Vui lòng nhập API key.' });
      }

      await listModelsForKey(apiKey);

      return res.json({
        ok: true,
        imageModel: IMAGE_MODEL,
        message: `API key hợp lệ. App sẽ dùng model ảnh: ${IMAGE_MODEL}.`,
      });
    } catch (error: any) {
      console.error('API key test failed:', error?.message || error);
      return res.status(401).json({ error: getApiErrorMessage(error) });
    }
  });

  app.post('/api/process-image', async (req, res) => {
    try {
      const { base64ImageData, mimeType } = req.body;
      const ai = getApiClient(req.body.apiKey);
      const quality = clampQuality(req.body.quality);
      const imageSize = normalizeImageSize(req.body.imageSize);
      const backgroundColor = normalizeBackground(req.body.backgroundColor);

      if (!ai) {
        return res.status(400).json({ error: 'Vui lòng nhập API key trước khi clone ảnh.' });
      }

      if (!base64ImageData || typeof base64ImageData !== 'string') {
        return res.status(400).json({ error: 'No image data provided.' });
      }

      if (!mimeType || typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
        return res.status(400).json({ error: 'Invalid image type.' });
      }

      const finalPrompt = `You are a professional print artwork cloning assistant. Your only job is to recreate the main artwork from the source image as a faithful 1:1 replica for printing.

Core clone requirements:
- Identify the main printed graphic, logo, illustration, text, or artwork.
- Clone the artwork as close to the source as possible: same colors, same layout, same typography, same proportions, same visible details.
- Remove only the physical capture artifacts: product surface, fabric texture, paper texture, wrinkles, shadows, reflections, seams, tags, camera perspective, blur, noise, compression artifacts, and background clutter.
- Correct perspective, rotation, curvature, skew, and warping so the artwork becomes flat and front-facing.
- Do not redesign, stylize, simplify, invent new elements, change text, change colors, or add mockups.
- Preserve the artwork aspect ratio and natural bounds. Center the cloned artwork with clean edges.

${getBackgroundInstruction(backgroundColor)}

Output:
- Return exactly one clean PNG image.
- Output size: ${imageSize}
- Fidelity/cleanup level: ${quality}/10 (${getQualityDescription(quality)})
- The result must be ready for print production and manual Photoshop cleanup if a solid chroma background was selected.`;

      const imageBase64 = await generateImage(ai, base64ImageData, mimeType, finalPrompt, imageSize);

      return res.json({
        data: imageBase64,
        imageSize,
        backgroundColor,
        model: IMAGE_MODEL,
      });
    } catch (error: any) {
      console.error('Error processing image:', error?.message || error);
      res.status(500).json({ error: getApiErrorMessage(error) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
