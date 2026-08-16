import React, { useState, useEffect } from 'react';
import { Users, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { useChatStore } from '../../store/chatStore.js';
import { Modal } from '../ui/Modal.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';

export function NewGroupModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  useEffect(() => {
    if (isOpen) {
      api.get('/contacts').then((res) => {
        setContacts(res.data.contacts || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  const toggleSelectMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.post('/groups', {
        name: name.trim(),
        description: description.trim(),
        memberIds: selectedMembers,
      });

      await fetchConversations();
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      description="Create a community space and invite members"
    >
      <form onSubmit={handleCreateGroup} className="space-y-4">
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Frontend Engineering Core"
          required
        />

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this group about?"
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-chat-muted">
            Add Members ({selectedMembers.length} selected)
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto border border-chat-border/60 rounded-xl p-2 bg-chat-panel/50">
            {contacts.map((c) => {
              const u = c.contactUser;
              const uId = u._id || u.id;
              const isSelected = selectedMembers.includes(uId);

              return (
                <div
                  key={uId}
                  onClick={() => toggleSelectMember(uId)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-600/20 text-white' : 'hover:bg-chat-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={u.avatar}
                      name={c.nickname || u.displayName || u.username}
                      size="sm"
                    />
                    <span className="text-xs font-medium text-white">
                      {c.nickname || u.displayName || u.username}
                    </span>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'border-chat-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}

            {contacts.length === 0 && (
              <p className="text-xs text-center text-chat-muted py-3">No contacts available to add</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!name.trim()}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default NewGroupModal;
