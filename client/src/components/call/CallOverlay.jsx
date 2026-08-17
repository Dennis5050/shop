import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useCallStore } from '../../store/callStore.js';
import { Avatar } from '../ui/Avatar.jsx';
import { VideoCallView } from './VideoCallView.jsx';
import { VoiceCallView } from './VoiceCallView.jsx';

export function CallOverlay() {
  const callState = useCallStore((s) => s.callState);
  const callType = useCallStore((s) => s.callType);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const isMuted = useCallStore((s) => s.isMuted);
  const isVideoOff = useCallStore((s) => s.isVideoOff);
  const connectionStatus = useCallStore((s) => s.connectionStatus);
  const callDuration = useCallStore((s) => s.callDuration);
  const errorMessage = useCallStore((s) => s.errorMessage);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleVideo = useCallStore((s) => s.toggleVideo);
  const endCall = useCallStore((s) => s.endCall);

  if (callState === 'idle' || callState === 'incoming_ringing') {
    return null;
  }

  const isVideo = callType === 'video';
  const isConnected = callState === 'connected';

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-4 sm:p-8 animate-fade-in select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Avatar
            src={remoteUser?.avatar}
            name={remoteUser?.displayName || remoteUser?.username}
            size="md"
          />
          <div>
            <h3 className="text-sm font-bold text-white">
              {remoteUser?.displayName || remoteUser?.username || 'User'}
            </h3>
            <p className="text-xs text-chat-muted">
              {callState === 'outgoing_ringing' && (
                <span className="text-amber-400 font-medium animate-pulse">Ringing...</span>
              )}
              {isConnected && (
                <span className="text-emerald-400 font-medium">{formatDuration(callDuration)}</span>
              )}
              {callState === 'ended' && (
                <span className="text-rose-400 font-medium">{errorMessage || 'Call Ended'}</span>
              )}
            </p>
          </div>
        </div>

        <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
          {isVideo ? 'Video' : 'Voice'} Call
        </span>
      </div>

      {/* Center Viewport */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl">
        {isVideo ? (
          <VideoCallView
            remoteUser={remoteUser}
            localStream={localStream}
            remoteStream={remoteStream}
            isVideoOff={isVideoOff}
            connectionStatus={connectionStatus}
          />
        ) : (
          <VoiceCallView
            remoteUser={remoteUser}
            callState={callState}
            isConnected={isConnected}
            isMuted={isMuted}
          />
        )}
      </div>

      {/* Floating Control Dock */}
      <div className="flex items-center justify-center gap-4 z-20 pt-2">
        {/* Mute Mic Button */}
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-all ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
              : 'bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Camera Toggle */}
        {isVideo && (
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-all ${
              isVideoOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
                : 'bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Hang Up / End Call */}
        <button
          onClick={endCall}
          className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-xl shadow-rose-600/30 transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider">End Call</span>
        </button>
      </div>
    </div>
  );
}

export default CallOverlay;
