import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
          Clone ảnh rep 1:1
        </h1>
        <p className="text-gray-400 mt-1 text-sm md:text-base">
          Tách artwork, làm phẳng, làm sạch và xuất PNG nền trong suốt hoặc nền chroma dễ tách.
        </p>
      </div>
    </header>
  );
};
