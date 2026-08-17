import crypto from 'crypto';

const ALLOWED_MIME_TYPES = {
  // Photos
  'image/jpeg': { ext: 'jpg', type: 'image' },
  'image/png': { ext: 'png', type: 'image' },
  'image/webp': { ext: 'webp', type: 'image' },
  'image/gif': { ext: 'gif', type: 'image' },

  // Videos
  'video/mp4': { ext: 'mp4', type: 'video' },
  'video/webm': { ext: 'webm', type: 'video' },
  'video/ogg': { ext: 'ogv', type: 'video' },
  'video/quicktime': { ext: 'mov', type: 'video' },

  // Audio & Voice Notes
  'audio/webm': { ext: 'webm', type: 'voice_note' },
  'audio/ogg': { ext: 'ogg', type: 'voice_note' },
  'audio/mp3': { ext: 'mp3', type: 'voice_note' },
  'audio/mpeg': { ext: 'mp3', type: 'voice_note' },
  'audio/wav': { ext: 'wav', type: 'voice_note' },
  'audio/x-m4a': { ext: 'm4a', type: 'voice_note' },
};

/**
 * Validates and normalizes media payloads
 * @param {string} dataUrl Base64 or URL data
 * @param {string} [declaredType]
 * @returns {{ mediaUrl: string, mediaType: string, fileSize: number, mimeType: string }}
 */
export function processMediaUpload(dataUrl, declaredType = null) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    const err = new Error('Invalid media data provided');
    err.status = 400;
    throw err;
  }

  // Handle standard HTTP URL
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return {
      mediaUrl: dataUrl,
      mediaType: declaredType || 'image',
      fileSize: 0,
      mimeType: declaredType === 'video' ? 'video/mp4' : (declaredType === 'voice_note' ? 'audio/webm' : 'image/jpeg'),
    };
  }

  // Handle Data URL (data:image/jpeg;base64,...)
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    // If raw base64 string provided without prefix
    return {
      mediaUrl: dataUrl,
      mediaType: declaredType || 'image',
      fileSize: Math.round((dataUrl.length * 3) / 4),
      mimeType: declaredType === 'video' ? 'video/mp4' : (declaredType === 'voice_note' ? 'audio/webm' : 'image/jpeg'),
    };
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];
  const fileSize = Math.round((base64Data.length * 3) / 4);

  // Validate file size limit (50MB for video, 10MB for photos, 5MB for audio)
  if (fileSize > 50 * 1024 * 1024) {
    const err = new Error('Media file exceeds maximum allowed limit of 50MB');
    err.status = 400;
    throw err;
  }

  const config = ALLOWED_MIME_TYPES[mimeType] || {
    ext: 'bin',
    type: declaredType || 'file',
  };

  return {
    mediaUrl: dataUrl,
    mediaType: config.type,
    mimeType,
    fileSize,
  };
}

export default processMediaUpload;
