import React, { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { OutputArea } from './components/OutputArea';
import { processImageWithGemini, testApiKey } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState<string>('API key chỉ được giữ trong phiên đang mở, không lưu vào file hay trình duyệt.');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileInfo, setOriginalFileInfo] = useState<{ name: string; type: string } | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(8);
  const [imageSize, setImageSize] = useState<string>('1K');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);
    setApiStatus('idle');
    setApiMessage('API key chỉ được giữ trong phiên đang mở, không lưu vào file hay trình duyệt.');
  }, []);

  const handleTestApiKey = useCallback(async () => {
    if (!apiKey.trim() || apiStatus === 'testing') return;

    setApiStatus('testing');
    setApiMessage('Đang kiểm tra API key...');

    try {
      const result = await testApiKey(apiKey);
      setApiStatus('ok');
      setApiMessage(result.message);
    } catch (err) {
      console.error(err);
      setApiStatus('error');
      setApiMessage(err instanceof Error ? err.message : 'Không thể kiểm tra API key.');
    }
  }, [apiKey, apiStatus]);

  const handleImageUpload = useCallback((file: File) => {
    fileToBase64(file)
      .then((base64) => {
        setOriginalImage(base64);
        setOriginalFileInfo({ name: file.name, type: file.type });
        setProcessedImage(null);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Không thể đọc file ảnh. Vui lòng thử lại.');
      });
  }, []);

  const handleProcessImage = useCallback(async () => {
    if (!originalImage || !originalFileInfo || isLoading) return;

    if (!apiKey.trim()) {
      setError('Vui lòng nhập API key trước khi clone ảnh.');
      return;
    }

    setIsLoading(true);
    setProcessedImage(null);
    setError(null);

    try {
      const base64Data = originalImage.split(',')[1];
      const resultBase64 = await processImageWithGemini(
        apiKey,
        base64Data,
        originalFileInfo.type,
        quality,
        imageSize,
        backgroundColor,
      );

      setProcessedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      console.error(err);
      setError('Đã có lỗi khi clone ảnh. Hãy thử lại ở 1K, đổi nền dễ tách hơn, hoặc kiểm tra API key.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, originalImage, originalFileInfo, quality, imageSize, backgroundColor, isLoading]);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setOriginalFileInfo(null);
    setProcessedImage(null);
    setIsLoading(false);
    setError(null);
    setQuality(8);
    setImageSize('1K');
    setBackgroundColor('transparent');
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <section className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label htmlFor="api-key" className="mb-2 block text-sm font-medium text-gray-300">
                API key dùng cho phiên này
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(event) => handleApiKeyChange(event.target.value)}
                placeholder="Dán API key rồi bấm Test API"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-3 text-gray-100 outline-none transition-colors focus:border-cyan-500"
              />
            </div>
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={!apiKey.trim() || apiStatus === 'testing' || isLoading}
              className="rounded-md bg-cyan-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              {apiStatus === 'testing' ? 'Đang test...' : 'Test API'}
            </button>
          </div>
          <p
            className={`mt-2 text-sm ${
              apiStatus === 'ok' ? 'text-emerald-300' : apiStatus === 'error' ? 'text-red-300' : 'text-gray-500'
            }`}
          >
            {apiMessage}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Dùng nút Copy key trong AI Studio rồi dán vào đây. Không gõ lại theo ảnh chụp vì dễ nhầm ký tự như O/0, I/l.
          </p>
        </section>

        <div className="mb-6 rounded-lg border border-cyan-900/70 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">
          Chức năng chính: clone artwork rep 1:1 để in. Nếu nền trong suốt chưa sạch, chọn nền chroma tương phản cao rồi tách thủ công trong Photoshop.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UploadArea
            onImageUpload={handleImageUpload}
            originalImage={originalImage}
            onProcess={handleProcessImage}
            isLoading={isLoading}
            onReset={handleReset}
            quality={quality}
            onQualityChange={setQuality}
            imageSize={imageSize}
            onImageSizeChange={setImageSize}
            backgroundColor={backgroundColor}
            onBackgroundColorChange={setBackgroundColor}
            canProcess={!!apiKey.trim()}
          />
          <OutputArea
            processedImage={processedImage}
            isLoading={isLoading}
            error={error}
            originalFileName={originalFileInfo?.name}
            imageSize={imageSize}
            backgroundColor={backgroundColor}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Clone ảnh rep 1:1 cho in ấn. API key không được lưu sau khi đóng app.</p>
      </footer>
    </div>
  );
};

export default App;
