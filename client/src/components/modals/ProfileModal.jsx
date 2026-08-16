import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Avatar } from '../ui/Avatar.jsx';

export function ProfileModal({ isOpen, onClose }) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your personal details visible to other members"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-4 py-2">
          <Avatar src={avatar} name={displayName || user?.username} size="xl" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">@{user?.username}</h4>
            <p className="text-xs text-chat-muted">{user?.email}</p>
          </div>
        </div>

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <Input
          label="Avatar Image URL (optional)"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-chat-muted">Bio (max 160 chars)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            placeholder="Tell us about yourself..."
            className="w-full bg-chat-panel text-sm text-chat-bubbleText rounded-xl p-3 border border-chat-border focus:border-brand-500 outline-none resize-none"
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProfileModal;
