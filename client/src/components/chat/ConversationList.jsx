import React, { useState } from 'react';
import { Search, MessageSquarePlus, MoreVertical, CheckCheck, Check, Filter } from 'lucide-react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { format, isToday, isYesterday } from 'date-fns';

export function ConversationList({ onOpenNewChat, onOpenNewGroup }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'groups'
  const [showMenu, setShowMenu] = useState(false);

  const conversations = useChatStore((s) => s.conversations);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const isUserOnline = usePresenceStore((s) => s.isOnline);
  const currentUser = useAuthStore((s) => s.user);

  const filteredConversations = conversations.filter((c) => {
    if (filter === 'unread' && (!c.unreadCount || c.unreadCount === 0)) return false;
    if (filter === 'groups' && c.type !== 'group') return false;

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

  const formatChatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return format(date, 'HH:mm');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'dd/MM/yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-[400px] bg-[#111b21] border-r border-[#222d34] flex flex-col h-full shrink-0 select-none">
      {/* WhatsApp Header */}
      <div className="h-16 px-4 bg-[#202c33] flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-[#e9edef] tracking-tight">Chats</h2>
        <div className="flex items-center gap-2 text-[#aebac1]">
          <button
            onClick={onOpenNewChat}
            title="New chat"
            className="p-2 rounded-full hover:bg-[#374248] transition-colors"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Menu"
              className="p-2 rounded-full hover:bg-[#374248] transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 w-48 bg-[#233138] border border-[#2a3942] rounded-xl shadow-2xl py-2 z-30 animate-fade-in text-sm text-[#d1d7db]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenNewGroup();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
                >
                  New group
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenNewChat();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
                >
                  New community
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
                >
                  Starred messages
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Search Bar & Filter Pills */}
      <div className="p-3 space-y-2 border-b border-[#222d34]/60">
        <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-[#8696a0] shrink-0 mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-transparent text-xs text-[#e9edef] placeholder:text-[#8696a0] outline-none"
          />
        </div>

        {/* WhatsApp Filter Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'groups', label: 'Groups' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === chip.id
                  ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40 font-semibold'
                  : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] flex flex-col items-center gap-3">
            <Search className="w-8 h-8 opacity-40" />
            <p className="text-xs">No chats found</p>
            <button
              onClick={onOpenNewChat}
              className="text-xs text-[#00a884] font-semibold hover:underline"
            >
              Start chatting
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const convId = String(conv._id || conv.id);
            const isActive = activeConversation && String(activeConversation._id || activeConversation.id) === convId;
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
            const isLastMsgOutgoing = lastMsg && String(lastMsg.sender?._id || lastMsg.sender) === String(currentUser?._id || currentUser?.id);

            return (
              <div
                key={convId}
                onClick={() => setActiveConversation(conv)}
                className={`flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
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
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-sm font-semibold text-[#e9edef] truncate">{title}</h4>
                    {lastMsg?.createdAt && (
                      <span className={`text-[11px] shrink-0 ml-2 ${conv.unreadCount > 0 ? 'text-[#00a884] font-bold' : 'text-[#8696a0]'}`}>
                        {formatChatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0 text-xs">
                      {isLastMsgOutgoing && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                      )}
                      {isTyping ? (
                        <span className="text-[#00a884] font-medium animate-pulse truncate">
                          {activeTyping.join(', ')} typing...
                        </span>
                      ) : (
                        <p className="text-[#8696a0] truncate">
                          {lastMsg ? lastMsg.content : 'Tap to chat'}
                        </p>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#25D366] text-[#111b21] text-[11px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
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
