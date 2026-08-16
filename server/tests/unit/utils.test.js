import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, comparePassword } from '../../src/utils/password.js';
import { generateToken, verifyToken } from '../../src/utils/token.js';
import { sanitize } from '../../src/utils/logger.js';

describe('Backend Utilities Test Suite', () => {
  describe('Password Hashing & Verification', () => {
    it('should hash a password and verify correctly', async () => {
      const password = 'SuperSecretPassword123!';
      const hash = await hashPassword(password);

      assert.ok(hash);
      assert.notStrictEqual(hash, password);
      assert.strictEqual(hash.startsWith('$2'), true);

      const isValid = await comparePassword(password, hash);
      assert.strictEqual(isValid, true);

      const isInvalid = await comparePassword('WrongPassword', hash);
      assert.strictEqual(isInvalid, false);
    });

    it('should reject empty passwords', async () => {
      await assert.rejects(async () => {
        await hashPassword('');
      }, /non-empty string/);
    });
  });

  describe('JWT Token Generation & Verification', () => {
    it('should sign and verify valid JWT token', () => {
      const payload = { userId: 'usr_12345', email: 'test@nexus.dev', username: 'nexususer' };
      const token = generateToken(payload);

      assert.ok(token);
      const decoded = verifyToken(token);

      assert.strictEqual(decoded.userId, 'usr_12345');
      assert.strictEqual(decoded.email, 'test@nexus.dev');
      assert.strictEqual(decoded.username, 'nexususer');
    });

    it('should throw error when token is invalid or missing', () => {
      assert.throws(() => verifyToken(''), /Token is required/);
      assert.throws(() => verifyToken('invalid.jwt.token'), /invalid token|jwt/i);
    });
  });

  describe('Logger Sensitive Key Sanitization', () => {
    it('should redact sensitive keys in objects', () => {
      const raw = {
        username: 'dennis',
        password: 'plain_password',
        token: 'secret_jwt_string',
        nested: {
          apiKey: 'key_12345',
          publicInfo: 'visible',
        },
      };

      const clean = sanitize(raw);

      assert.strictEqual(clean.username, 'dennis');
      assert.strictEqual(clean.password, '***REDACTED***');
      assert.strictEqual(clean.token, '***REDACTED***');
      assert.strictEqual(clean.nested.apiKey, '***REDACTED***');
      assert.strictEqual(clean.nested.publicInfo, 'visible');
    });
  });
});
