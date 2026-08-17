import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '../../store/callStore.js';
import { Avatar } from '../ui/Avatar.jsx';

export function IncomingCallDialog() {
  const callState = useCallStore((s) => s.callState);
  const callType = useCallStore((s) => s.callType);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const acceptIncomingCall = useCallStore((s) => s.acceptIncomingCall);
  const rejectIncomingCall = useCallStore((s) => s.rejectIncomingCall);

  if (callState !== 'incoming_ringing' || !remoteUser) {
    return null;
  }

  const isVideo = callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-chat-sidebar border border-chat-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-scale-in">
        {/* Calling Pulsing Avatar */}
        <div className="relative inline-flex items-center justify-center mx-auto">
          <span className="absolute w-24 h-24 rounded-full bg-brand-500/20 animate-ping" />
          <span className="absolute w-20 h-20 rounded-full bg-brand-500/30 animate-pulse" />
          <Avatar
            src={remoteUser.avatar}
            name={remoteUser.displayName || remoteUser.username}
            size="xl"
            className="ring-4 ring-brand-500 shadow-xl relative z-10"
          />
        </div>

        {/* Caller Info */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            {remoteUser.displayName || remoteUser.username}
          </h3>
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
            {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            Incoming {isVideo ? 'Video Call' : 'Voice Call'}...
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Decline */}
          <button
            onClick={() => rejectIncomingCall('declined')}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-transform active:scale-95 outline-none"
            title="Decline Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Accept */}
          <button
            onClick={acceptIncomingCall}
            className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 animate-bounce outline-none"
            title="Accept Call"
          >
            {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallDialog;
