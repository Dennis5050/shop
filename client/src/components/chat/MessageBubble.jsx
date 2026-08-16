import React, { useState } from 'react';
import { Check, CheckCheck, Clock, Smile, CornerUpLeft, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { socketManager } from '../../socket/socket.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';
import { format } from 'date-fns';

const QUICK_EMOJIS = ['❤️', '👍', '🔥', '😂', '😮', '😢'];

export function MessageBubble({ message, onReply, onDelete }) {
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
      return <Clock className="w-3 h-3 text-white/60 animate-spin" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-white/70" />;
    }
    if (status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />;
    }
    return <Check className="w-3 h-3 text-white/70" />;
  };

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : '';

  return (
    <div
      className={`group relative flex flex-col mb-2.5 max-w-[85%] md:max-w-[70%] ${
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      }`}
    >
      {/* Quick Action Overlay (Hover) */}
      <div
        className={`absolute -top-7 hidden group-hover:flex items-center gap-1 bg-chat-sidebar/95 border border-chat-border px-1.5 py-1 rounded-xl shadow-lg z-10 transition-opacity ${
          isOutgoing ? 'right-0' : 'left-0'
        }`}
      >
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1 rounded-lg text-chat-muted hover:text-amber-400 hover:bg-chat-hover transition-colors"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showPicker && (
            <div className="absolute top-8 left-0 flex items-center gap-1.5 bg-chat-panel border border-chat-border p-1.5 rounded-2xl shadow-2xl z-20">
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
            className="p-1 rounded-lg text-chat-muted hover:text-white hover:bg-chat-hover transition-colors"
            title="Reply"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {isOutgoing && onDelete && (
          <button
            onClick={() => onDelete(message._id || message.id)}
            className="p-1 rounded-lg text-chat-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all text-sm leading-relaxed ${
          isOutgoing
            ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-br-sm'
            : 'bg-chat-bubbleIn text-chat-bubbleText border border-chat-border/40 rounded-bl-sm'
        }`}
      >
        {/* Reply Context Header */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-brand-400 text-xs opacity-90">
            <p className="font-semibold">{message.replyTo.sender?.displayName || 'User'}</p>
            <p className="truncate line-clamp-1">{message.replyTo.content}</p>
          </div>
        )}

        {/* Media Image / File */}
        {message.mediaUrl && message.type === 'image' && (
          <img
            src={message.mediaUrl}
            alt="Message attachment"
            className="rounded-xl max-h-60 w-auto object-cover mb-2 ring-1 ring-black/20"
          />
        )}

        {/* Message Content */}
        {message.isDeleted ? (
          <p className="italic opacity-60 text-xs">This message was deleted</p>
        ) : (
          <p className="break-words whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Timestamp & Status footer */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-70">
          <span>{formattedTime}</span>
          {renderStatus()}
        </div>
      </div>

      {/* Emoji Reactions Bar */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 z-0">
          {message.reactions.map((r, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-chat-sidebar/90 border border-chat-border/60 text-xs px-1.5 py-0.5 rounded-full shadow-sm select-none"
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
