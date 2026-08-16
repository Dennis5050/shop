import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-chat-bg text-chat-bubbleText overflow-hidden">
      <Routes>
        <Route path="/" element={<div className="flex-1 flex items-center justify-center font-bold text-xl">Nexus Real-Time Platform</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
