export interface ApiKeyTestResult {
  ok: boolean;
  imageModel: string | null;
  message: string;
}

export const testApiKey = async (apiKey: string): Promise<ApiKeyTestResult> => {
  const response = await fetch('/api/test-api-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned status ${response.status}`);
  }

  return response.json();
};

export const processImageWithGemini = async (
  apiKey: string,
  base64ImageData: string,
  mimeType: string,
  quality: number,
  imageSize: string,
  backgroundColor: string,
): Promise<string> => {
  const response = await fetch('/api/process-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      base64ImageData,
      mimeType,
      quality,
      imageSize,
      backgroundColor,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned status ${response.status}`);
  }

  const result = await response.json();
  return result.data;
};
