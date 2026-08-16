import React from 'react';
import { MessageSquare, Rss, Users, Settings, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';

export function Navbar({ activeTab, onSelectTab, onOpenProfile }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = usePresenceStore((s) => s.isOnline(user?._id || user?.id));
  const unreadNotifs = useNotificationStore((s) => s.unreadCount);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'feed', label: 'Feed', icon: Rss },
    { id: 'contacts', label: 'Contacts', icon: Users },
  ];

  return (
    <nav className="w-16 md:w-20 bg-chat-sidebar border-r border-chat-border flex flex-col items-center justify-between py-5 shrink-0 select-none z-20">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-extrabold text-lg tracking-wider cursor-pointer transform transition-transform hover:scale-105">
          N
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                className={`relative p-3 rounded-2xl transition-all duration-200 group outline-none ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 shadow-sm'
                    : 'text-chat-muted hover:text-white hover:bg-chat-hover'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-4">
        {/* Notifications */}
        <button
          onClick={() => onSelectTab('notifications')}
          title="Notifications"
          className={`relative p-3 rounded-2xl text-chat-muted hover:text-white hover:bg-chat-hover transition-colors outline-none ${
            activeTab === 'notifications' ? 'bg-brand-600/20 text-brand-400' : ''
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-500 rounded-full ring-2 ring-chat-sidebar animate-pulse" />
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          title="Edit Profile"
          className="relative transition-transform hover:scale-105 outline-none"
        >
          <Avatar
            src={user?.avatar}
            name={user?.displayName || user?.username}
            size="md"
            isOnline={isOnline}
            showStatus={true}
          />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2.5 rounded-xl text-chat-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors outline-none"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
