import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen = false,
  onClose,
  title = '',
  description = '',
  children,
  maxWidth = 'max-w-md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative w-full ${maxWidth} bg-chat-sidebar border border-chat-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-chat-border bg-chat-header/50">
          <div>
            {title && <h3 className="text-base font-bold text-white">{title}</h3>}
            {description && <p className="text-xs text-chat-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-chat-muted hover:text-white hover:bg-chat-hover transition-colors outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
