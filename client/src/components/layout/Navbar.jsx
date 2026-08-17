import React from 'react';
import { MessageSquare, CircleDashed, Radio, Users, Settings, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { usePresenceStore } from '../../store/presenceStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { Avatar } from '../ui/Avatar.jsx';

export function Navbar({ activeTab, onSelectTab, onOpenProfile }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = usePresenceStore((s) => s.isOnline(user?._id || user?.id));
  const unreadNotifs = useNotificationStore((s) => s.unreadCount);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'feed', label: 'Status & Channels', icon: CircleDashed },
    { id: 'contacts', label: 'Communities & Contacts', icon: Users },
  ];

  return (
    <nav className="w-16 bg-[#202c33] border-r border-[#222d34] flex flex-col items-center justify-between py-3 shrink-0 select-none z-20">
      {/* Top Nav Action Icons */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* WhatsApp Meta Icon Indicator */}
        <div
          onClick={() => onSelectTab('chats')}
          className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shadow-md text-white font-black text-xl cursor-pointer hover:opacity-90 transition-opacity mb-2"
          title="WhatsApp Meta"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
          </svg>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col gap-1 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                className={`relative p-3 rounded-full flex items-center justify-center transition-colors outline-none ${
                  isActive
                    ? 'bg-[#374248] text-[#00a884]'
                    : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374248]/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00a884] rounded-r-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Notifications */}
        <button
          onClick={() => onSelectTab('notifications')}
          title="Notifications"
          className={`relative p-3 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374248]/50 transition-colors outline-none ${
            activeTab === 'notifications' ? 'bg-[#374248] text-[#00a884]' : ''
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#25D366] rounded-full ring-2 ring-[#202c33] animate-pulse" />
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          title="Profile & Settings"
          className="relative rounded-full transition-transform hover:scale-105 outline-none"
        >
          <Avatar
            src={user?.avatar}
            name={user?.displayName || user?.username}
            size="sm"
            isOnline={isOnline}
            showStatus={true}
          />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Log out"
          className="p-2 rounded-full text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors outline-none"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
