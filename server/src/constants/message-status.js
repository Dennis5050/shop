export const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

export const MessageTypes = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  VOICE_NOTE: 'voice_note',
  AUDIO: 'audio',
  FILE: 'file',
  SYSTEM: 'system',
};

export default {
  MessageStatus,
  MessageTypes,
};
