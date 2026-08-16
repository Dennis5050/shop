import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/token.js';
import validator from 'validator';

export class AuthService {
  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Registers a new user account
   * @param {Object} params 
   * @returns {Promise<Object>} Created user and signed token
   */
  async register(params) {
    const { username, displayName, email, password } = params;

    if (!username || typeof username !== 'string') {
      const err = new Error('Username is required');
      err.status = 400;
      throw err;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      const err = new Error('Username must be between 3 and 30 characters');
      err.status = 400;
      throw err;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      const err = new Error('Username can only contain alphanumeric characters, underscores, and dots');
      err.status = 400;
      throw err;
    }

    if (!email || !validator.isEmail(email)) {
      const err = new Error('A valid email address is required');
      err.status = 400;
      throw err;
    }

    if (!password || password.length < 6) {
      const err = new Error('Password must be at least 6 characters');
      err.status = 400;
      throw err;
    }

    // Check duplicate username
    const existingUsername = await this.userRepo.findByUsername(cleanUsername);
    if (existingUsername) {
      const err = new Error(`Username "${cleanUsername}" is already taken`);
      err.status = 409;
      err.code = 'USERNAME_EXISTS';
      throw err;
    }

    // Check duplicate email
    const cleanEmail = email.trim().toLowerCase();
    const existingEmail = await this.userRepo.findByEmail(cleanEmail);
    if (existingEmail) {
      const err = new Error(`Email "${cleanEmail}" is already registered`);
      err.status = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const user = await this.userRepo.create({
      username: cleanUsername,
      displayName: (displayName || cleanUsername).trim(),
      email: cleanEmail,
      passwordHash,
    });

    const token = generateToken({
      userId: user._id,
      email: user.email,
      username: user.username,
    });

    return {
      user,
      token,
    };
  }

  /**
   * Authenticates user via email or username and password
   * @param {Object} params 
   * @returns {Promise<Object>} Authenticated user and signed token
   */
  async login(params) {
    const { login, password } = params;

    if (!login || !password) {
      const err = new Error('Email/username and password are required');
      err.status = 400;
      throw err;
    }

    const cleanLogin = login.trim().toLowerCase();
    let user = null;

    if (cleanLogin.includes('@')) {
      user = await this.userRepo.findByEmail(cleanLogin, true);
    } else {
      user = await this.userRepo.findByUsername(cleanLogin, true);
    }

    if (!user || !user.passwordHash) {
      const err = new Error('Invalid email/username or password');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      const err = new Error('Invalid email/username or password');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      username: user.username,
    });

    // Remove password hash from response
    delete user.passwordHash;

    return {
      user,
      token,
    };
  }

  /**
   * Retrieves currently logged in user profile
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      const err = new Error('User not found or session expired');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return user;
  }

  /**
   * Changes user password
   * @param {string} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<boolean>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters');
      err.status = 400;
      throw err;
    }

    const user = await this.userRepo.findById(userId, true);
    if (!user || !user.passwordHash) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Current password is incorrect');
      err.status = 400;
      err.code = 'INVALID_CURRENT_PASSWORD';
      throw err;
    }

    const newHash = await hashPassword(newPassword);
    await this.userRepo.update(userId, { passwordHash: newHash });
    return true;
  }
}

export const authService = new AuthService();
export default authService;
