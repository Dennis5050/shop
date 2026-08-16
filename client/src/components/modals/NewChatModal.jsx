import React, { useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { api } from '../../services/api.js';
import { useChatStore } from '../../store/chatStore.js';
import { Modal } from '../ui/Modal.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Input } from '../ui/Input.jsx';

export function NewChatModal({ isOpen, onClose, onChatCreated }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const handleSearch = async (val) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get('/users/search', { q: val.trim() });
      setResults(res.data.users || []);
    } catch (err) {
      console.error('User search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (user) => {
    try {
      const res = await api.post('/conversations/private', {
        recipientId: user._id || user.id,
      });
      await fetchConversations();
      setActiveConversation(res.data.conversation);
      onClose();
      if (onChatCreated) onChatCreated();
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Direct Message"
      description="Search for people across the platform to start a conversation"
    >
      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by username or name..."
          leftIcon={<Search className="w-4 h-4" />}
          autoFocus
        />

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user._id || user.id}
              onClick={() => handleStartChat(user)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-chat-hover cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.avatar}
                  name={user.displayName || user.username}
                  size="md"
                />
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {user.displayName || user.username}
                  </h4>
                  <p className="text-xs text-chat-muted">@{user.username}</p>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-brand-400" />
            </div>
          ))}

          {query.trim() && results.length === 0 && !isSearching && (
            <p className="text-xs text-center text-chat-muted py-4">No users found</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default NewChatModal;
