import React, { useState } from 'react';
import { X, Image as ImageIcon, Film, Send } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export function MediaUploadModal({ isOpen, onClose, onSendMedia, initialFile = null }) {
  const [fileData, setFileData] = useState(null); // { url, type, name, size }
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = () => {
      setFileData({
        url: reader.result,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        mimeType: file.type,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!fileData) return;
    setIsUploading(true);
    try {
      await onSendMedia({
        dataUrl: fileData.url,
        type: fileData.type,
        caption: caption.trim(),
        fileName: fileData.name,
        mimeType: fileData.mimeType,
      });
      handleClose();
    } catch (err) {
      console.error('Failed to send media:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFileData(null);
    setCaption('');
    setIsUploading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={fileData ? (fileData.type === 'video' ? 'Send Video' : 'Send Photo') : 'Upload Photo or Video'}
      size="md"
    >
      <div className="space-y-4">
        {!fileData ? (
          <div className="border-2 border-dashed border-chat-border hover:border-brand-500 rounded-3xl p-8 text-center transition-colors">
            <input
              type="file"
              id="media-file-input"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="media-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Film className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Click or drag & drop to upload</p>
                <p className="text-xs text-chat-muted">Supports JPEG, PNG, WEBP, GIF, MP4, and WebM (up to 50MB)</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview Box */}
            <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-chat-border max-h-72 flex items-center justify-center">
              {fileData.type === 'video' ? (
                <video
                  src={fileData.url}
                  controls
                  className="max-h-72 w-full object-contain"
                />
              ) : (
                <img
                  src={fileData.url}
                  alt="Upload preview"
                  className="max-h-72 w-full object-contain"
                />
              )}
            </div>

            {/* File info */}
            <div className="flex items-center justify-between text-xs text-chat-muted">
              <span className="truncate max-w-[200px]">{fileData.name}</span>
              <span>{fileData.size}</span>
            </div>

            {/* Caption Input */}
            <Input
              placeholder="Add a caption... (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
            />

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setFileData(null)}>
                Change File
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                isLoading={isUploading}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send {fileData.type === 'video' ? 'Video' : 'Photo'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default MediaUploadModal;
