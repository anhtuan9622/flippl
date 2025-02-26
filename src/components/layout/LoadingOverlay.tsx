import React from 'react';

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="text-xl font-bold text-black neo-brutalist-white px-8 py-4">
        Loading...
      </div>
    </div>
  );
}