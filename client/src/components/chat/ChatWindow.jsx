import React, { useRef, useEffect, useState } from 'react';
import { Phone, Video, MoreVertical, Search, Lock, MessageSquare } from 'lucide-react';
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

  const convId = activeConversation ? String(activeConversation._id || activeConversation.id) : null;
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
      <div className="flex-1 bg-[#222e35] flex flex-col items-center justify-center p-8 text-center select-none border-b-8 border-[#00a884]">
        <div className="w-24 h-24 rounded-full bg-[#111b21] flex items-center justify-center mb-6 shadow-xl ring-1 ring-white/5">
          <svg className="w-12 h-12 text-[#00a884] fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-light text-[#e9edef] mb-2 tracking-wide">WhatsApp Web</h3>
        <p className="text-sm text-[#8696a0] max-w-md leading-relaxed">
          Send and receive messages without keeping your phone online.<br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-12 opacity-80">
          <Lock className="w-3.5 h-3.5 text-[#8696a0]" /> End-to-end encrypted
        </div>
      </div>
    );
  }

  const handleSendMessage = (content, type, mediaUrl, reply, mediaMeta) => {
    sendMessage(content, type, mediaUrl, reply, mediaMeta);
    setReplyingTo(null);
  };

  return (
    <div className="flex-1 bg-[#0b141a] flex flex-col h-full overflow-hidden">
      {/* WhatsApp Header */}
      <div className="h-16 px-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 z-10 select-none">
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar
            src={avatarUrl}
            name={title}
            size="md"
            isOnline={isOnline}
            showStatus={!isGroup}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#e9edef] truncate">{title}</h3>
            <p className="text-xs text-[#8696a0] truncate">
              {isTyping ? (
                <span className="text-[#00a884] font-medium animate-pulse">
                  {activeTyping.join(', ')} typing...
                </span>
              ) : isGroup ? (
                `${(activeConversation.members || []).length || (activeConversation.participants || []).length || 2} members`
              ) : isOnline ? (
                <span className="text-[#00a884] font-medium">online</span>
              ) : (
                'last seen recently'
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-[#aebac1]">
          {!isGroup && (
            <>
              <button
                onClick={() => {
                  const targetUser = activeConversation.otherUser || (activeConversation.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
                  if (targetUser) startCall(targetUser, 'video', convId);
                }}
                className="p-2 rounded-full hover:bg-[#374248] transition-colors"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const targetUser = activeConversation.otherUser || (activeConversation.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
                  if (targetUser) startCall(targetUser, 'voice', convId);
                }}
                className="p-2 rounded-full hover:bg-[#374248] transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
            </>
          )}
          <button className="p-2 rounded-full hover:bg-[#374248] transition-colors" title="Search...">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-[#374248] transition-colors" title="Menu">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Stream Viewport with WhatsApp Wallpaper */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-4 space-y-1 whatsapp-wallpaper">
        {/* End-to-End Encryption Notice */}
        <div className="my-3 flex justify-center">
          <div className="bg-[#182229] border border-[#222d34] rounded-lg px-4 py-1.5 max-w-md text-center shadow-sm">
            <p className="text-[11px] text-[#ffd279] flex items-center justify-center gap-1.5 leading-relaxed">
              <Lock className="w-3 h-3 text-[#ffd279] shrink-0" />
              Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
            </p>
          </div>
        </div>

        {/* Messages List */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id || msg.id}
            message={msg}
            onReply={(m) => setReplyingTo(m)}
            onViewMedia={(media) => setActiveMedia(media)}
          />
        ))}

        {/* Real-time typing indicator bubble */}
        {isTyping && (
          <div className="flex items-center gap-2 bg-[#202c33] px-3.5 py-2 rounded-xl w-fit text-xs text-[#8696a0] animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1 text-[#e9edef]">{activeTyping[0]} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Message Composer */}
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
