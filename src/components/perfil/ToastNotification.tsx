'use client';

import { FC, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const ToastNotification: FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger CSS transition entering
    const enterTimeout = setTimeout(() => setIsVisible(true), 10);
    
    // Auto close
    const closeTimeout = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit transition before fully unmounting via parent
      setTimeout(onClose, 300);
    }, 3000);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(closeTimeout);
    };
  }, [onClose]);

  const config = {
    success: { icon: CheckCircle, className: 'bg-green-50 text-green-800 border-green-200' },
    error: { icon: XCircle, className: 'bg-red-50 text-red-800 border-red-200' },
    info: { icon: Info, className: 'bg-blue-50 text-blue-800 border-blue-200' },
  };

  const Icon = config[type].icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${config[type].className}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium text-sm">{message}</p>
      </div>
    </div>
  );
};
