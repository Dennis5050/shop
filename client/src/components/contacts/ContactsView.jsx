import React, { useState, useEffect } from 'react';
import { UserPlus, MessageSquare, Trash2, Search } from 'lucide-react';
import { api } from '../../services/api.js';
import { useChatStore } from '../../store/chatStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export function ContactsView({ onStartChat }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [newContactTarget, setNewContactTarget] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const isOnline = usePresenceStore((s) => s.isOnline);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactTarget.trim()) return;

    setIsAdding(true);
    setError(null);
    try {
      await api.post('/contacts', { target: newContactTarget.trim() });
      setNewContactTarget('');
      await fetchContacts();
    } catch (err) {
      setError(err.message || 'Failed to add contact');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      setContacts((prev) => prev.filter((c) => (c._id || c.id) !== contactId));
    } catch (err) {
      console.error('Failed to remove contact:', err);
    }
  };

  const handleStartMessage = async (contactUser) => {
    try {
      const res = await api.post('/conversations/private', {
        recipientId: contactUser._id || contactUser.id,
      });
      setActiveConversation(res.data.conversation);
      if (onStartChat) onStartChat();
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const u = c.contactUser;
    return (
      (c.nickname || '').toLowerCase().includes(q) ||
      (u?.displayName || '').toLowerCase().includes(q) ||
      (u?.username || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 bg-chat-panel flex flex-col h-full p-4 md:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header & Add Contact Card */}
        <div className="bg-chat-sidebar border border-chat-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-white">Contacts & Directory</h2>
          <form onSubmit={handleAddContact} className="flex gap-2">
            <Input
              value={newContactTarget}
              onChange={(e) => setNewContactTarget(e.target.value)}
              placeholder="Add contact by username or email..."
              error={error}
              className="bg-chat-panel"
            />
            <Button
              type="submit"
              isLoading={isAdding}
              disabled={!newContactTarget.trim()}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add
            </Button>
          </form>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-chat-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter saved contacts..."
            className="w-full bg-chat-sidebar text-xs text-chat-bubbleText pl-10 pr-4 py-2.5 rounded-xl border border-chat-border focus:border-brand-500 outline-none"
          />
        </div>

        {/* Contacts List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredContacts.map((c) => {
            const u = c.contactUser;
            const contactId = c._id || c.id;
            const online = isOnline(u?._id || u?.id);

            return (
              <div
                key={contactId}
                className="bg-chat-sidebar border border-chat-border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={u?.avatar}
                    name={c.nickname || u?.displayName || u?.username}
                    size="md"
                    isOnline={online}
                    showStatus={true}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {c.nickname || u?.displayName || u?.username}
                    </h4>
                    <p className="text-xs text-chat-muted truncate">@{u?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleStartMessage(u)}
                    className="p-2 rounded-xl text-brand-400 hover:bg-brand-500/10 transition-colors"
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveContact(contactId)}
                    className="p-2 rounded-xl text-chat-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ContactsView;
