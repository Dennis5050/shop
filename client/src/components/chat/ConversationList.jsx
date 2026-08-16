import React, { useState } from 'react';
import { Search, Plus, Users, MessageSquarePlus } from 'lucide-react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';
import { formatDistanceToNowStrict } from 'date-fns';

export function ConversationList({ onOpenNewChat, onOpenNewGroup }) {
  const [search, setSearch] = useState('');
  const conversations = useChatStore((s) => s.conversations);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const isUserOnline = usePresenceStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (c.type === 'group') {
      return (c.name || '').toLowerCase().includes(q);
    }
    const other = c.otherUser || (c.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
    return (
      (other?.displayName || '').toLowerCase().includes(q) ||
      (other?.username || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full md:w-80 lg:w-96 bg-chat-sidebar border-r border-chat-border flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-chat-border flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNewChat}
            title="New Chat"
            className="p-2 rounded-xl text-chat-muted hover:text-white hover:bg-chat-hover transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewGroup}
            title="New Group"
            className="p-2 rounded-xl text-chat-muted hover:text-white hover:bg-chat-hover transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-chat-border/50">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-chat-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-chat-panel text-xs text-chat-bubbleText pl-9 pr-3 py-2 rounded-xl border border-chat-border/80 focus:border-brand-500 focus:outline-none transition-colors placeholder:text-chat-muted/60"
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-chat-border/20">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-chat-muted flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-chat-panel flex items-center justify-center text-chat-muted">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs">No conversations found</p>
            <button
              onClick={onOpenNewChat}
              className="text-xs text-brand-400 font-semibold hover:underline mt-1"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const convId = conv._id || conv.id;
            const isActive = activeConversation && (activeConversation._id || activeConversation.id) === convId;
            const isGroup = conv.type === 'group';

            let title = 'Chat';
            let avatarUrl = '';
            let isOnline = false;

            if (isGroup) {
              title = conv.name || 'Group Chat';
              avatarUrl = conv.avatar || '';
            } else {
              const other = conv.otherUser || (conv.participants || []).find((p) => String(p._id || p) !== String(currentUser?._id || currentUser?.id));
              title = other?.displayName || other?.username || 'User';
              avatarUrl = other?.avatar || '';
              isOnline = isUserOnline(other?._id || other?.id);
            }

            const activeTyping = (typingUsers[convId] || []).filter((u) => u !== currentUser?.username);
            const isTyping = activeTyping.length > 0;

            const lastMsg = conv.lastMessage;
            const formattedTime = lastMsg?.createdAt
              ? formatDistanceToNowStrict(new Date(lastMsg.createdAt), { addSuffix: false })
              : '';

            return (
              <div
                key={convId}
                onClick={() => setActiveConversation(conv)}
                className={`flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-all duration-150 relative ${
                  isActive
                    ? 'bg-chat-active/90 border-l-4 border-brand-500 pl-3'
                    : 'hover:bg-chat-hover/70'
                }`}
              >
                <Avatar
                  src={avatarUrl}
                  name={title}
                  size="md"
                  isOnline={isOnline}
                  showStatus={!isGroup}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
                    {formattedTime && (
                      <span className="text-[11px] text-chat-muted shrink-0 ml-2">
                        {formattedTime}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {isTyping ? (
                      <span className="text-xs text-brand-400 font-medium italic truncate animate-pulse">
                        {activeTyping.join(', ')} typing...
                      </span>
                    ) : (
                      <p className="text-xs text-chat-muted truncate">
                        {lastMsg ? lastMsg.content : 'No messages yet'}
                      </p>
                    )}

                    {conv.unreadCount > 0 && (
                      <Badge variant="counter">{conv.unreadCount}</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
