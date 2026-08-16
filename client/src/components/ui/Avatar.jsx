import React from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const badgeSizeMap = {
  xs: 'w-1.5 h-1.5 bottom-0 right-0',
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
  lg: 'w-3 h-3 bottom-0.5 right-0.5',
  xl: 'w-4 h-4 bottom-1 right-1',
  '2xl': 'w-4.5 h-4.5 bottom-1 right-1',
};

export function Avatar({
  src,
  alt = 'User Avatar',
  name = '',
  size = 'md',
  isOnline = false,
  showStatus = false,
  className = '',
}) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const badgeSizeClass = badgeSizeMap[size] || badgeSizeMap.md;

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${sizeClass} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover ring-1 ring-slate-700/50"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-inner uppercase">
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute rounded-full ring-2 ring-chat-sidebar transition-colors ${badgeSizeClass} ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

export default Avatar;
