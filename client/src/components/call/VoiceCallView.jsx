import React from 'react';
import { Volume2, Wifi } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';

export function VoiceCallView({
  remoteUser,
  callState,
  isConnected,
  isMuted,
}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 select-none">
      {/* Concentric Pulse Rings */}
      <div className="relative inline-flex items-center justify-center mb-8">
        {isConnected && (
          <>
            <span className="absolute w-44 h-44 rounded-full bg-brand-500/10 animate-ping" />
            <span className="absolute w-36 h-36 rounded-full bg-brand-500/20 animate-pulse" />
          </>
        )}
        {callState === 'outgoing_ringing' && (
          <span className="absolute w-40 h-40 rounded-full bg-amber-500/20 animate-ping" />
        )}
        <Avatar
          src={remoteUser?.avatar}
          name={remoteUser?.displayName || remoteUser?.username}
          size="2xl"
          className="ring-4 ring-brand-500/80 shadow-2xl relative z-10"
        />
      </div>

      {/* User Info */}
      <div className="space-y-1 z-10">
        <h3 className="text-2xl font-bold text-white tracking-wide">
          {remoteUser?.displayName || remoteUser?.username || 'User'}
        </h3>
        <p className="text-xs text-chat-muted uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
          {isConnected ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" /> High Definition Voice
            </span>
          ) : callState === 'outgoing_ringing' ? (
            <span className="text-amber-400 animate-pulse">Ringing...</span>
          ) : (
            'Connecting...'
          )}
        </p>
      </div>

      {/* Muted indicator */}
      {isMuted && (
        <div className="mt-4 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold">
          Microphone Muted
        </div>
      )}
    </div>
  );
}

export default VoiceCallView;
