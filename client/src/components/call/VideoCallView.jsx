import React, { useRef, useEffect } from 'react';
import { Avatar } from '../ui/Avatar.jsx';

export function VideoCallView({
  remoteUser,
  localStream,
  remoteStream,
  isVideoOff,
  connectionStatus,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-3xl bg-slate-950">
      {/* Remote Video Stream */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="relative">
            <span className="w-28 h-28 rounded-full bg-brand-500/20 animate-ping absolute inset-0 m-auto" />
            <Avatar
              src={remoteUser?.avatar}
              name={remoteUser?.displayName || remoteUser?.username}
              size="2xl"
              className="ring-4 ring-brand-500/60 shadow-2xl relative z-10"
            />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white">
              {remoteUser?.displayName || remoteUser?.username}
            </h4>
            <p className="text-xs text-chat-muted mt-1">Connecting WebRTC video feed...</p>
          </div>
        </div>
      )}

      {/* Picture-in-Picture Local Camera Feed */}
      <div className="absolute bottom-5 right-5 w-36 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-brand-500 shadow-2xl bg-black z-20 transition-all">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
        />
        {isVideoOff && (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-chat-muted text-xs font-semibold">
            Camera Off
          </div>
        )}
      </div>

      {/* Connection State Badge */}
      <div className="absolute top-4 left-4 z-20">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400">
          {connectionStatus === 'connected' ? '● HD Live' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
}

export default VideoCallView;
