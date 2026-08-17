import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from 'lucide-react';
import { useCallStore } from '../../store/callStore.js';
import { Avatar } from '../ui/Avatar.jsx';

export function CallOverlay() {
  const callState = useCallStore((s) => s.callState);
  const callType = useCallStore((s) => s.callType);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const isMuted = useCallStore((s) => s.isMuted);
  const isVideoOff = useCallStore((s) => s.isVideoOff);
  const callDuration = useCallStore((s) => s.callDuration);
  const errorMessage = useCallStore((s) => s.errorMessage);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleVideo = useCallStore((s) => s.toggleVideo);
  const endCall = useCallStore((s) => s.endCall);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

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
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800">
        {isVideo ? (
          <>
            {/* Remote Video (Full Size) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-3xl"
            />

            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-4">
                <Avatar
                  src={remoteUser?.avatar}
                  name={remoteUser?.displayName || remoteUser?.username}
                  size="2xl"
                  className="mb-4 animate-pulse ring-4 ring-brand-500/40"
                />
                <h4 className="text-lg font-bold text-white">
                  {remoteUser?.displayName || remoteUser?.username}
                </h4>
                <p className="text-xs text-chat-muted mt-1">Connecting video stream...</p>
              </div>
            )}

            {/* Local Video PIP (Draggable/Corner Box) */}
            <div className="absolute bottom-4 right-4 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-brand-500/80 shadow-2xl bg-black z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-chat-muted text-xs font-semibold">
                  Camera Off
                </div>
              )}
            </div>
          </>
        ) : (
          /* Voice Call Audio Pulse View */
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="relative inline-flex items-center justify-center mb-6">
              {isConnected && (
                <>
                  <span className="absolute w-36 h-36 rounded-full bg-emerald-500/10 animate-ping" />
                  <span className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-pulse" />
                </>
              )}
              {callState === 'outgoing_ringing' && (
                <span className="absolute w-32 h-32 rounded-full bg-brand-500/20 animate-ping" />
              )}
              <Avatar
                src={remoteUser?.avatar}
                name={remoteUser?.displayName || remoteUser?.username}
                size="2xl"
                className="ring-4 ring-slate-700 shadow-2xl relative z-10"
              />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {remoteUser?.displayName || remoteUser?.username}
            </h3>
            <p className="text-xs text-chat-muted">
              {callState === 'outgoing_ringing' ? 'Calling...' : isConnected ? 'Voice Connected' : 'Call Ending'}
            </p>
          </div>
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
