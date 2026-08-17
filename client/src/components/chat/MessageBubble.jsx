import React, { useState } from 'react';
import { Check, CheckCheck, Clock, Smile, CornerUpLeft, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { socketManager } from '../../socket/socket.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';
import { VoiceNotePlayer } from './VoiceNotePlayer.jsx';
import { format } from 'date-fns';

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export function MessageBubble({ message, onReply, onDelete, onViewMedia }) {
  const currentUser = useAuthStore((s) => s.user);
  const [showPicker, setShowPicker] = useState(false);

  const senderId = message.sender?._id || message.sender?.id || message.sender;
  const isOutgoing = String(senderId) === String(currentUser?._id || currentUser?.id);

  const handleAddReaction = (emoji) => {
    setShowPicker(false);
    socketManager.emit(SOCKET_EVENTS.MESSAGE_REACTION, {
      messageId: message._id || message.id,
      conversationId: message.conversation,
      emoji,
      action: 'add',
    });
  };

  const renderStatus = () => {
    if (!isOutgoing) return null;
    const status = message.status || 'sent';

    if (status === 'sending') {
      return <Clock className="w-3 h-3 text-[#8696a0] animate-spin" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />;
    }
    if (status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />;
    }
    return <Check className="w-3 h-3 text-[#8696a0]" />;
  };

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : '';

  return (
    <div
      className={`group relative flex flex-col mb-2 max-w-[85%] sm:max-w-[70%] lg:max-w-[65%] ${
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      }`}
    >
      {/* Quick Action Hover Menu */}
      <div
        className={`absolute -top-7 hidden group-hover:flex items-center gap-1 bg-[#233138] border border-[#2a3942] px-1.5 py-0.5 rounded-lg shadow-lg z-10 transition-opacity ${
          isOutgoing ? 'right-0' : 'left-0'
        }`}
      >
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1 rounded-md text-[#8696a0] hover:text-[#e9edef] transition-colors"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showPicker && (
            <div className="absolute top-8 left-0 flex items-center gap-1.5 bg-[#233138] border border-[#2a3942] p-1.5 rounded-2xl shadow-2xl z-20">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="hover:scale-125 transition-transform text-base p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {onReply && (
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-md text-[#8696a0] hover:text-[#e9edef] transition-colors"
            title="Reply"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {isOutgoing && onDelete && (
          <button
            onClick={() => onDelete(message._id || message.id)}
            className="p-1 rounded-md text-[#8696a0] hover:text-rose-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* WhatsApp Message Bubble Container */}
      <div
        className={`relative px-3 pt-2 pb-1.5 rounded-lg shadow-sm text-sm text-[#e9edef] ${
          isOutgoing
            ? 'bubble-outgoing text-[#e9edef]'
            : 'bubble-incoming text-[#e9edef]'
        }`}
      >
        {/* Quoted Reply Box */}
        {message.replyTo && (
          <div className="mb-1.5 p-2 rounded-md bg-[#000000]/25 border-l-4 border-[#00a884] text-xs">
            <p className="font-semibold text-[#00a884]">
              {message.replyTo.sender?.displayName || 'User'}
            </p>
            <p className="text-[#8696a0] truncate line-clamp-1">
              {message.replyTo.content || `[${message.replyTo.type}]`}
            </p>
          </div>
        )}

        {/* 1. WhatsApp Voice Note */}
        {message.type === 'voice_note' && message.mediaUrl && (
          <VoiceNotePlayer
            audioUrl={message.mediaUrl}
            duration={message.mediaMeta?.duration || 0}
            isOutgoing={isOutgoing}
          />
        )}

        {/* 2. WhatsApp Photo Attachment */}
        {message.type === 'image' && message.mediaUrl && (
          <div
            onClick={() => onViewMedia && onViewMedia({ url: message.mediaUrl, type: 'image', caption: message.content })}
            className="cursor-pointer rounded-lg overflow-hidden mb-1.5 group/img"
          >
            <img
              src={message.mediaUrl}
              alt="Photo"
              className="rounded-lg max-h-72 w-auto object-cover transition-transform group-hover/img:scale-101"
            />
          </div>
        )}

        {/* 3. WhatsApp Video Attachment */}
        {message.type === 'video' && message.mediaUrl && (
          <div className="rounded-lg overflow-hidden mb-1.5 max-h-72 max-w-sm">
            <video
              src={message.mediaUrl}
              controls
              playsInline
              className="rounded-lg w-full max-h-72 object-contain bg-black/40"
            />
          </div>
        )}

        {/* Message Content & Inline Timestamp */}
        {message.isDeleted ? (
          <p className="italic text-[#8696a0] text-xs">This message was deleted</p>
        ) : (
          message.content && (
            <p className="break-words whitespace-pre-wrap leading-relaxed pr-14 inline-block">
              {message.content}
            </p>
          )
        )}

        {/* Bottom-right embedded timestamp & tick mark */}
        <div className="float-right flex items-center gap-1 ml-2 mt-1 text-[11px] text-[#8696a0] select-none">
          <span>{formattedTime}</span>
          {renderStatus()}
        </div>
      </div>

      {/* Floating Emoji Reactions Badge */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 -mt-2.5 z-0 ${isOutgoing ? 'mr-1' : 'ml-1'}`}>
          {message.reactions.map((r, i) => (
            <span
              key={i}
              className="inline-flex items-center bg-[#202c33] border border-[#2a3942] text-xs px-1.5 py-0.5 rounded-full shadow-md select-none"
            >
              {r.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
