import { useRef, useCallback } from 'react';
import { socketManager } from '../socket/socket.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export function useTypingEmitter(conversationId) {
  const isTypingRef = useRef(false);
  const timeoutRef = useRef(null);

  const emitTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketManager.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketManager.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }, 2000);
  }, [conversationId]);

  const stopTypingNow = useCallback(() => {
    if (!conversationId) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketManager.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }
  }, [conversationId]);

  return {
    emitTyping,
    stopTypingNow,
  };
}

export default useTypingEmitter;
