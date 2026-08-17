import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { processMediaUpload } from '../../src/utils/storage.js';
import { messageService } from '../../src/services/message.service.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { conversationRepository } from '../../src/repositories/conversation.repository.js';
import { messageRepository } from '../../src/repositories/message.repository.js';

describe('Media & Voice Notes Processing Test Suite', () => {
  beforeEach(() => {
    userRepository.clear();
    conversationRepository.clear();
    messageRepository.clear();
  });

  describe('Media Storage & MIME Processing', () => {
    it('should validate and extract metadata from base64 photo data', () => {
      const dummyPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = processMediaUpload(dummyPhoto);

      assert.strictEqual(result.mediaType, 'image');
      assert.strictEqual(result.mimeType, 'image/png');
      assert.ok(result.fileSize > 0);
    });

    it('should validate and process audio voice note webm data', () => {
      const dummyAudio = 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAA';
      const result = processMediaUpload(dummyAudio, 'voice_note');

      assert.strictEqual(result.mediaType, 'voice_note');
      assert.strictEqual(result.mimeType, 'audio/webm');
      assert.ok(result.fileSize > 0);
    });

    it('should validate and process mp4 video data', () => {
      const dummyVideo = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==';
      const result = processMediaUpload(dummyVideo);

      assert.strictEqual(result.mediaType, 'video');
      assert.strictEqual(result.mimeType, 'video/mp4');
    });

    it('should reject invalid or oversized media', () => {
      assert.throws(() => {
        processMediaUpload('');
      }, /Invalid media/);
    });
  });

  describe('Voice Note & Media Message Persistence', () => {
    it('should send and persist a voice note with duration', async () => {
      const u1 = await userRepository.create({ username: 'audio_sender', displayName: 'Audio Sender', email: 'as@test.dev', passwordHash: 'h' });
      const u2 = await userRepository.create({ username: 'audio_rcvr', displayName: 'Audio Rcvr', email: 'ar@test.dev', passwordHash: 'h' });

      const conv = await conversationRepository.create({
        type: 'private',
        participants: [u1._id, u2._id],
      });

      const voiceMsg = await messageService.sendMessage({
        conversationId: conv._id,
        senderId: u1._id,
        content: '',
        type: 'voice_note',
        mediaUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAA',
        mediaMeta: {
          duration: 14.5,
          mimeType: 'audio/webm',
        },
      });

      assert.strictEqual(voiceMsg.type, 'voice_note');
      assert.strictEqual(voiceMsg.mediaMeta.duration, 14.5);

      const convEnriched = await conversationRepository.findById(conv._id);
      assert.strictEqual(convEnriched.lastMessage.content, '🎤 Voice note (15s)');
    });

    it('should send and persist a video message with thumbnail', async () => {
      const u1 = await userRepository.create({ username: 'v_sender', displayName: 'Video Sender', email: 'vs@test.dev', passwordHash: 'h' });
      const u2 = await userRepository.create({ username: 'v_rcvr', displayName: 'Video Rcvr', email: 'vr@test.dev', passwordHash: 'h' });

      const conv = await conversationRepository.create({
        type: 'private',
        participants: [u1._id, u2._id],
      });

      const videoMsg = await messageService.sendMessage({
        conversationId: conv._id,
        senderId: u1._id,
        content: 'Check out this live demo!',
        type: 'video',
        mediaUrl: 'https://example.com/demo.mp4',
        mediaMeta: {
          duration: 32,
          thumbnail: 'https://example.com/demo_thumb.jpg',
        },
      });

      assert.strictEqual(videoMsg.type, 'video');
      assert.strictEqual(videoMsg.content, 'Check out this live demo!');

      const convEnriched = await conversationRepository.findById(conv._id);
      assert.strictEqual(convEnriched.lastMessage.content, '🎥 Video: Check out this live demo!');
    });
  });
});
