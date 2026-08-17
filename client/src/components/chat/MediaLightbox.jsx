import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

export function MediaLightbox({ media, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!media) return null;

  const isVideo = media.type === 'video';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
    >
      {/* Top Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between z-20 text-white"
      >
        <span className="text-sm font-semibold truncate max-w-sm">
          {media.title || (isVideo ? 'Video Preview' : 'Photo Preview')}
        </span>
        <div className="flex items-center gap-3">
          {media.url && (
            <a
              href={media.url}
              download={media.fileName || (isVideo ? 'video.mp4' : 'photo.jpg')}
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-rose-600 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Viewer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center p-2 sm:p-6 max-h-[85vh] overflow-hidden"
      >
        {isVideo ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-2xl shadow-2xl"
          />
        ) : (
          <img
            src={media.url}
            alt={media.title || 'Photo view'}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl select-none"
          />
        )}
      </div>

      {/* Caption if provided */}
      {media.caption && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="text-center text-sm text-slate-300 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-2xl mx-auto max-w-xl truncate"
        >
          {media.caption}
        </div>
      )}
    </div>
  );
}

export default MediaLightbox;
