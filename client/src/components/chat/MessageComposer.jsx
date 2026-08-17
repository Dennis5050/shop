import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X, Image as ImageIcon, Mic } from 'lucide-react';
import { useTypingEmitter } from '../../hooks/useTypingEmitter.js';
import { useSound } from '../../hooks/useSound.js';
import { VoiceNoteRecorder } from './VoiceNoteRecorder.jsx';
import { MediaUploadModal } from '../modals/MediaUploadModal.jsx';

const COMMON_EMOJIS = ['😊', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '💯', '✨', '👋', '🙏', '😍', '😎', '🙌'];

export function MessageComposer({ conversationId, onSendMessage, replyingTo, onCancelReply }) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const textareaRef = useRef(null);
  const { emitTyping, stopTypingNow } = useTypingEmitter(conversationId);
  const { playSent } = useSound();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleChange = (e) => {
    setContent(e.target.value);
    emitTyping();
  };

  const handleSend = () => {
    if (!content.trim()) return;
    const text = content.trim();
    setContent('');
    stopTypingNow();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSendMessage(text, 'text', '', replyingTo);
    playSent();
  };

  const handleSendVoiceNote = (dataUrl, duration, mimeType) => {
    setIsRecordingVoice(false);
    onSendMessage('', 'voice_note', dataUrl, replyingTo, { duration, mimeType });
    playSent();
  };

  const handleSendMedia = async (mediaPayload) => {
    const { dataUrl, type, caption, fileName, mimeType } = mediaPayload;
    onSendMessage(caption || '', type, dataUrl, replyingTo, { fileName, mimeType });
    playSent();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative border-t border-chat-border bg-chat-sidebar p-3">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-chat-panel px-3.5 py-2 rounded-xl mb-2 border-l-4 border-brand-500 border border-chat-border/50 text-xs">
          <div className="min-w-0">
            <span className="font-semibold text-brand-400">
              Replying to {replyingTo.sender?.displayName || 'User'}
            </span>
            <p className="text-chat-muted truncate">{replyingTo.content || `[${replyingTo.type}]`}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-lg text-chat-muted hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-chat-panel border border-chat-border rounded-2xl p-3 shadow-2xl z-30 grid grid-cols-7 gap-2 animate-slide-up">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleInsertEmoji(emoji)}
              className="text-xl p-1.5 rounded-xl hover:bg-chat-hover hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Voice Note Recorder Mode vs Standard Input Bar */}
      {isRecordingVoice ? (
        <VoiceNoteRecorder
          onSendVoiceNote={handleSendVoiceNote}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="flex items-end gap-2 bg-chat-panel border border-chat-border/80 rounded-2xl px-3 py-1.5 focus-within:border-brand-500 transition-colors">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-chat-muted hover:text-amber-400 hover:bg-chat-hover rounded-xl transition-colors shrink-0 mb-0.5"
            title="Insert Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attach Photo / Video Button */}
          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="p-2 text-chat-muted hover:text-brand-400 hover:bg-chat-hover rounded-xl transition-colors shrink-0 mb-0.5"
            title="Attach Photo or Video"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-chat-bubbleText text-sm outline-none resize-none py-2 max-h-32 placeholder:text-chat-muted/60"
          />

          {/* Send or Mic Button */}
          {content.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all shrink-0 mb-0.5"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2 rounded-xl text-chat-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 mb-0.5"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Media Upload Modal */}
      <MediaUploadModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSendMedia={handleSendMedia}
      />
    </div>
  );
}

export default MessageComposer;
