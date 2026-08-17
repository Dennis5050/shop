import React, { useRef, useEffect, useState } from 'react';
import { Phone, Video, MoreVertical, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import { useCallStore } from '../../store/callStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { MessageBubble } from './MessageBubble.jsx';
import { MessageComposer } from './MessageComposer.jsx';
import { MediaLightbox } from './MediaLightbox.jsx';

export function ChatWindow() {
  const activeConversation = useChatStore((s) => s.activeConversation);
  const messages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const isUserOnline = usePresenceStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);
  const startCall = useCallStore((s) => s.startCall);

  const [replyingTo, setReplyingTo] = useState(null);
  const [activeMedia, setActiveMedia] = useState(null);
  const messagesEndRef = useRef(null);

  const convId = activeConversation ? (activeConversation._id || activeConversation.id) : null;
  const isGroup = activeConversation?.type === 'group';

  let title = 'Chat';
  let avatarUrl = '';
  let isOnline = false;

  if (isGroup) {
    title = activeConversation.name || 'Group Chat';
    avatarUrl = activeConversation.avatar || '';
  } else if (activeConversation) {
    const other = activeConversation.otherUser || (activeConversation.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
    title = other?.displayName || other?.username || 'User';
    avatarUrl = other?.avatar || '';
    isOnline = isUserOnline(other?._id || other?.id);
  }

  const activeTyping = (typingUsers[convId] || []).filter((u) => u !== currentUser?.username);
  const isTyping = activeTyping.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!activeConversation) {
    return (
      <div className="flex-1 bg-chat-panel flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-brand-600/10 text-brand-400 flex items-center justify-center mb-4 ring-1 ring-brand-500/20">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1">Nexus Real-Time Messenger</h3>
        <p className="text-sm text-chat-muted max-w-sm">
          Select an active conversation or start a new message to chat in real time.
        </p>
      </div>
    );
  }

  const handleSendMessage = (content, type, mediaUrl, reply) => {
    sendMessage(content, type, mediaUrl, reply);
    setReplyingTo(null);
  };

  return (
    <div className="flex-1 bg-chat-panel flex flex-col h-full overflow-hidden">
      {/* Chat Window Header */}
      <div className="h-16 px-5 border-b border-chat-border bg-chat-sidebar/60 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar
            src={avatarUrl}
            name={title}
            size="md"
            isOnline={isOnline}
            showStatus={!isGroup}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
            <p className="text-xs text-chat-muted truncate">
              {isTyping ? (
                <span className="text-brand-400 font-medium animate-pulse">
                  {activeTyping.join(', ')} typing...
                </span>
              ) : isGroup ? (
                `${(activeConversation.members || []).length || (activeConversation.participants || []).length || 2} members`
              ) : isOnline ? (
                <span className="text-emerald-400 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-chat-muted">
          {!isGroup && (
            <>
              <button
                onClick={() => {
                  const targetUser = activeConversation.otherUser || (activeConversation.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
                  if (targetUser) startCall(targetUser, 'voice', convId);
                }}
                className="p-2 rounded-xl hover:text-white hover:bg-chat-hover transition-colors"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const targetUser = activeConversation.otherUser || (activeConversation.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
                  if (targetUser) startCall(targetUser, 'video', convId);
                }}
                className="p-2 rounded-xl hover:text-white hover:bg-chat-hover transition-colors"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}
          <button className="p-2 rounded-xl hover:text-white hover:bg-chat-hover transition-colors" title="Options">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream Viewport */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id || msg.id}
            message={msg}
            onReply={(m) => setReplyingTo(m)}
            onViewMedia={(media) => setActiveMedia(media)}
          />
        ))}

        {/* Real-time typing bubble */}
        {isTyping && (
          <div className="flex items-center gap-2 bg-chat-bubbleIn border border-chat-border/40 px-3.5 py-2 rounded-2xl w-fit text-xs text-chat-muted animate-pulse">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-chat-bubbleText">{activeTyping[0]} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer
        conversationId={convId}
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Media Lightbox Fullscreen Viewer */}
      <MediaLightbox
        media={activeMedia}
        onClose={() => setActiveMedia(null)}
      />
    </div>
  );
}

export default ChatWindow;
