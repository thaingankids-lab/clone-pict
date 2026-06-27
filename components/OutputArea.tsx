import React from 'react';
import { Spinner } from './Spinner';
import { DownloadIcon, WarningIcon } from './icons';

interface OutputAreaProps {
  processedImage: string | null;
  isLoading: boolean;
  error: string | null;
  originalFileName: string | undefined;
  imageSize: string;
  backgroundColor: string;
}

const getBackgroundLabel = (backgroundColor: string): string => {
  switch (backgroundColor) {
    case 'transparent':
      return 'nền trong suốt';
    case '#00FF00':
      return 'nền chroma xanh lá';
    case '#FF00FF':
      return 'nền magenta';
    case '#0000FF':
      return 'nền xanh dương';
    case '#00FFFF':
      return 'nền cyan';
    case '#FFFF00':
      return 'nền vàng';
    case '#FFFFFF':
      return 'nền trắng';
    case '#000000':
      return 'nền đen';
    default:
      return 'nền đã chọn';
  }
};

const getBackgroundSlug = (backgroundColor: string): string => {
  if (backgroundColor === 'transparent') return 'transparent';
  return backgroundColor.replace('#', '').toLowerCase();
};

export const OutputArea: React.FC<OutputAreaProps> = ({
  processedImage,
  isLoading,
  error,
  originalFileName,
  imageSize,
  backgroundColor,
}) => {
  const backgroundLabel = getBackgroundLabel(backgroundColor);

  const getDownloadFileName = () => {
    const suffix = `clone-${getBackgroundSlug(backgroundColor)}-${imageSize.toLowerCase()}.png`;

    if (!originalFileName) {
      return `print-${suffix}`;
    }

    const nameWithoutExtension = originalFileName.split('.').slice(0, -1).join('.') || originalFileName;
    return `${nameWithoutExtension}-${suffix}`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-800 flex flex-col h-full gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-200">2. Ảnh clone rep 1:1 {imageSize}</h2>
        <div
          className="flex min-h-[400px] flex-grow items-center justify-center rounded-md border border-gray-800 p-4"
          style={{
            backgroundImage:
              'linear-gradient(45deg, rgba(255,255,255,0.10) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.10) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.10) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.10) 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
            backgroundColor: '#111827',
          }}
        >
          {isLoading ? (
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-gray-300">Đang clone ảnh rep 1:1...</p>
              <p className="text-sm text-gray-500">Đầu ra sẽ dùng {backgroundLabel}.</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-300">
              <WarningIcon className="w-12 h-12 mx-auto mb-2" />
              <p className="font-semibold">Lỗi xử lý</p>
              <p>{error}</p>
            </div>
          ) : processedImage ? (
            <img src={processedImage} alt="Ảnh clone đã xử lý" className="max-w-full max-h-[50vh] object-contain" />
          ) : (
            <div className="text-center text-gray-500">
              <p>Kết quả clone sẽ hiển thị ở đây. Nền caro giúp kiểm tra vùng trong suốt.</p>
            </div>
          )}
        </div>

        {processedImage && (
          <div className="mt-4">
            <a
              href={processedImage}
              download={getDownloadFileName()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white font-semibold rounded-md shadow-md hover:bg-emerald-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-emerald-500"
            >
              <DownloadIcon className="w-5 h-5" />
              Tải xuống PNG {backgroundLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
