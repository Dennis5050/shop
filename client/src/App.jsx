import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore.js';
import { useChatStore } from './store/chatStore.js';
import { useSocketEvents } from './hooks/useSocketEvents.js';
import { AuthPage } from './components/auth/AuthPage.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { ConversationList } from './components/chat/ConversationList.jsx';
import { ChatWindow } from './components/chat/ChatWindow.jsx';
import { FeedView } from './components/social/FeedView.jsx';
import { ContactsView } from './components/contacts/ContactsView.jsx';
import { NotificationDrawer } from './components/notifications/NotificationDrawer.jsx';
import { NewChatModal } from './components/modals/NewChatModal.jsx';
import { NewGroupModal } from './components/modals/NewGroupModal.jsx';
import { ProfileModal } from './components/modals/ProfileModal.jsx';

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initAuth = useAuthStore((s) => s.initAuth);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'feed' | 'contacts' | 'notifications'
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Initialize Auth & Socket events
  useEffect(() => {
    initAuth();
  }, []);

  useSocketEvents();

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-screen bg-chat-bg text-chat-bubbleText overflow-hidden font-sans antialiased select-none">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* 2. Main Viewport Switcher */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'chats' && (
          <>
            <ConversationList
              onOpenNewChat={() => setIsNewChatOpen(true)}
              onOpenNewGroup={() => setIsNewGroupOpen(true)}
            />
            <ChatWindow />
          </>
        )}

        {activeTab === 'feed' && <FeedView />}

        {activeTab === 'contacts' && (
          <ContactsView onStartChat={() => setActiveTab('chats')} />
        )}

        {activeTab === 'notifications' && (
          <NotificationDrawer onClose={() => setActiveTab('chats')} />
        )}
      </main>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onChatCreated={() => setActiveTab('chats')}
      />

      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default App;
