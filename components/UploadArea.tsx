import React, { useCallback, useState } from 'react';
import { UploadIcon, ProcessIcon, ResetIcon } from './icons';

interface UploadAreaProps {
  onImageUpload: (file: File) => void;
  originalImage: string | null;
  onProcess: () => void;
  isLoading: boolean;
  onReset: () => void;
  quality: number;
  onQualityChange: (quality: number) => void;
  imageSize: string;
  onImageSizeChange: (size: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  canProcess: boolean;
}

const imageSizeOptions = [
  { value: '1K', label: 'Tiết kiệm', desc: 'Bản nháp, ít tốn API nhất' },
  { value: '2K', label: 'Chất lượng', desc: 'Dùng khi ảnh cần rõ hơn' },
  { value: '4K', label: 'Siêu nét', desc: 'Chỉ dùng cho file cuối' },
];

const backgroundOptions = [
  { value: 'transparent', label: 'Trong suốt', note: 'File PNG lý tưởng', swatch: 'checker' },
  { value: '#00FF00', label: 'Chroma xanh lá', note: 'Dễ key nhất nếu ảnh không có xanh lá', swatch: '#00FF00' },
  { value: '#FF00FF', label: 'Hồng magenta', note: 'Tốt khi artwork có nhiều xanh', swatch: '#FF00FF' },
  { value: '#0000FF', label: 'Xanh dương', note: 'Tốt khi artwork không có xanh dương', swatch: '#0000FF' },
  { value: '#00FFFF', label: 'Cyan', note: 'Tương phản tốt với đỏ/cam', swatch: '#00FFFF' },
  { value: '#FFFF00', label: 'Vàng', note: 'Tốt cho artwork tối màu', swatch: '#FFFF00' },
  { value: '#FFFFFF', label: 'Trắng', note: 'Dùng khi artwork tối', swatch: '#FFFFFF' },
  { value: '#000000', label: 'Đen', note: 'Dùng khi artwork sáng', swatch: '#000000' },
];

const checkerStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #777 25%, transparent 25%), linear-gradient(-45deg, #777 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #777 75%), linear-gradient(-45deg, transparent 75%, #777 75%)',
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
  backgroundColor: '#aaa',
};

export const UploadArea: React.FC<UploadAreaProps> = ({
  onImageUpload,
  originalImage,
  onProcess,
  isLoading,
  onReset,
  quality,
  onQualityChange,
  imageSize,
  onImageSizeChange,
  backgroundColor,
  onBackgroundColorChange,
  canProcess,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onImageUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files?.[0]) {
        onImageUpload(e.dataTransfer.files[0]);
      }
    },
    [onImageUpload],
  );

  const isProcessButtonDisabled = !originalImage || !canProcess || isLoading;

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-800 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">1. Ảnh gốc và thiết lập clone</h2>
      <div
        className={`flex min-h-[320px] items-center justify-center border-2 border-dashed rounded-md transition-colors duration-300 ${
          isDragging ? 'border-cyan-400 bg-gray-800/70' : 'border-gray-700 bg-black/20'
        }`}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
      >
        {originalImage ? (
          <div className="p-4 w-full h-full flex items-center justify-center">
            <img src={originalImage} alt="Ảnh gốc" className="max-w-full max-h-96 object-contain rounded-md" />
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center text-center p-8 cursor-pointer text-gray-400 hover:text-cyan-300"
          >
            <UploadIcon className="w-12 h-12 mb-2" />
            <span className="font-semibold">Nhấn để tải ảnh lên</span>
            <span className="text-sm">hoặc kéo và thả vào đây</span>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      <div className="mt-6">
        <label className="block mb-2 text-sm font-medium text-gray-400">Độ phân giải đầu ra</label>
        <div className="grid grid-cols-3 gap-2">
          {imageSizeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onImageSizeChange(opt.value)}
              disabled={!originalImage || isLoading}
              title={opt.desc}
              className={`flex min-h-[76px] flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                imageSize === opt.value
                  ? 'bg-cyan-700 border-cyan-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold">{opt.label}</span>
              <span className="mt-1 font-mono text-xs opacity-80">{opt.value}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">Dùng 1K để test bố cục, chỉ chọn 4K khi xuất bản cuối.</p>
      </div>

      <div className="mt-6">
        <label htmlFor="quality-slider" className="block mb-2 text-sm font-medium text-gray-400">
          Mức rep 1:1 và làm sạch: <span className="font-bold text-cyan-300">{quality}</span>/10
        </label>
        <input
          id="quality-slider"
          type="range"
          min="1"
          max="10"
          value={quality}
          onChange={(e) => onQualityChange(parseInt(e.target.value, 10))}
          disabled={!originalImage || isLoading}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>

      <div className="mt-6">
        <label className="block mb-3 text-sm font-medium text-gray-400">Nền đầu ra để tách thủ công khi cần</label>
        <div className="grid grid-cols-2 gap-2">
          {backgroundOptions.map((option) => {
            const selected = backgroundColor === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onBackgroundColorChange(option.value)}
                disabled={!originalImage || isLoading}
                className={`flex min-h-[68px] items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? 'border-cyan-500 bg-cyan-950/70 text-white'
                    : 'border-gray-700 bg-gray-950 text-gray-300 hover:border-gray-500'
                }`}
              >
                <span
                  className="h-9 w-9 shrink-0 rounded-md border border-gray-600"
                  style={option.swatch === 'checker' ? checkerStyle : { backgroundColor: option.swatch }}
                />
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-gray-500">{option.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onProcess}
          disabled={isProcessButtonDisabled}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-700 text-white font-semibold rounded-md shadow-md hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-cyan-500"
        >
          <ProcessIcon className="w-5 h-5" />
          {isLoading ? 'Đang clone...' : `Clone rep 1:1 ${imageSize}`}
        </button>
        <button
          onClick={onReset}
          disabled={!originalImage}
          title="Làm lại"
          className="w-full sm:w-auto px-4 py-3 bg-gray-700 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-gray-500"
        >
          <ResetIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
