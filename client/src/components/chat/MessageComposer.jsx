import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Plus, X, Image as ImageIcon, Mic, FileText, Camera, User as UserIcon } from 'lucide-react';
import { useTypingEmitter } from '../../hooks/useTypingEmitter.js';
import { useSound } from '../../hooks/useSound.js';
import { VoiceNoteRecorder } from './VoiceNoteRecorder.jsx';
import { MediaUploadModal } from '../modals/MediaUploadModal.jsx';

const COMMON_EMOJIS = ['😊', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '💯', '✨', '👋', '🙏', '😍', '😎', '🙌'];

export function MessageComposer({ conversationId, onSendMessage, replyingTo, onCancelReply }) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
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
    <div className="relative bg-[#202c33] px-4 py-2 select-none">
      {/* Replying Context Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#182229] px-3.5 py-2 rounded-lg mb-2 border-l-4 border-[#00a884] border border-[#222d34] text-xs">
          <div className="min-w-0">
            <span className="font-semibold text-[#00a884]">
              {replyingTo.sender?.displayName || 'User'}
            </span>
            <p className="text-[#8696a0] truncate">{replyingTo.content || `[${replyingTo.type}]`}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-md text-[#8696a0] hover:text-[#e9edef] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* WhatsApp Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-[#233138] border border-[#2a3942] rounded-2xl p-3 shadow-2xl z-30 grid grid-cols-7 gap-2 animate-slide-up">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleInsertEmoji(emoji)}
              className="text-xl p-1.5 rounded-xl hover:bg-[#182229] hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 bg-[#233138] border border-[#2a3942] rounded-2xl p-3 shadow-2xl z-30 flex flex-col gap-2 animate-slide-up w-52">
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setIsMediaModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-sm text-[#e9edef] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Photos & videos</span>
          </button>

          <button
            onClick={() => {
              setShowAttachMenu(false);
              setIsMediaModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-sm text-[#e9edef] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <span>Camera</span>
          </button>

          <button
            onClick={() => {
              setShowAttachMenu(false);
              setIsMediaModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-sm text-[#e9edef] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document</span>
          </button>
        </div>
      )}

      {/* Voice Note Recorder Mode vs WhatsApp Input Bar */}
      {isRecordingVoice ? (
        <VoiceNoteRecorder
          onSendVoiceNote={handleSendVoiceNote}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachMenu(false);
            }}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0"
            title="Emojis"
          >
            <Smile className="w-6 h-6" />
          </button>

          {/* Plus Attachment Button */}
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiPicker(false);
            }}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0"
            title="Attach"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* WhatsApp Text Input Pill */}
          <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2 flex items-center">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              rows={1}
              className="w-full bg-transparent text-[#e9edef] text-sm outline-none resize-none max-h-32 placeholder:text-[#8696a0]"
            />
          </div>

          {/* WhatsApp Send or Voice Mic Button */}
          {content.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"
              title="Send"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2 text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0"
              title="Record voice note"
            >
              <Mic className="w-6 h-6" />
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
