'use client';

import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // 4秒後に自動で閉じる
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div 
      className={`fixed top-5 right-5 px-6 py-4 rounded-lg text-white font-bold shadow-2xl ${bgColor} z-50 animate-slide-in flex items-center gap-3 max-w-md`}
      role="alert"
    >
      <span className="text-2xl">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 font-bold text-xl"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  );
}
