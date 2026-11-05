const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Register a new Farmer or Institution account.
 * Direct public registration for 'admin' is strictly forbidden.
 */
const register = async (req, res) => {
  try {
    let { email, password, role, profile, languagePreference } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and account role are required.'
      });
    }

    email = String(email).toLowerCase().trim();

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Role safety check: public users can NEVER register as admin
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be registered publicly. Please contact system administration.'
      });
    }

    if (!['farmer', 'institution'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "farmer" or "institution".'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please log in or use a different email.'
      });
    }

    // Create user with immediately active 'approved' status.
    const user = await User.create({
      email,
      password,
      role,
      status: 'approved',
      languagePreference: languagePreference || 'en',
      profile: {
        fullName: profile?.fullName ? String(profile.fullName).trim() : '',
        institutionName: profile?.institutionName ? String(profile.institutionName).trim() : '',
        contactPerson: profile?.contactPerson ? String(profile.contactPerson).trim() : '',
        phone: profile?.phone ? String(profile.phone).trim() : '',
        villageTown: profile?.villageTown ? String(profile.villageTown).trim() : '',
        district: profile?.district ? String(profile.district).trim() : '',
        state: profile?.state ? String(profile.state).trim() : 'Andhra Pradesh'
      }
    });

    // Welcome notification (non-fatal if notification service encounters any issue)
    try {
      await createNotification({
        recipient: user._id,
        title: 'Welcome to FarmLink!',
        message: `Your ${role} account is now active. You can start using the platform immediately.`,
        type: 'account_status',
        relatedModel: 'User',
        relatedId: user._id
      });
    } catch (notifErr) {
      console.warn('[Register Notice] Notification creation skipped:', notifErr.message);
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. You can now log in and use FarmLink.',
      token,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    console.error('[Register Error]', error);

    // Clean handling for MongoDB unique email duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered. Please log in or use a different email.'
      });
    }

    // Clean handling for Mongoose schema validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join('. ');
      return res.status(400).json({
        success: false,
        message: messages || 'Invalid user details provided.'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

/**
 * Log in with email and password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact college administration for assistance.'
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

/**
 * Get current authenticated user details
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json({
      success: true,
      user: user.toSafeObject(true)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Request password reset email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return success even if not found to prevent user enumeration
      return res.json({
        success: true,
        message: 'If that email address is in our database, we will send you a password reset link.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour validity

    await user.save();

    const hostUrl = req.get('origin') || process.env.CLIENT_URL || 'http://localhost:5173';
    await sendPasswordResetEmail({
      toEmail: user.email,
      resetToken,
      hostUrl
    });

    return res.json({
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    return res.status(500).json({ success: false, message: 'Could not process password reset request.' });
  }
};

/**
 * Reset password using token
 * Crucial rule: Password reset must NOT alter approval or suspension status
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.'
      });
    }

    // Set new password (the pre-save hook will hash it)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save user. NOTE: status is untouched, preserving approval/suspension status
    await user.save();

    return res.json({
      success: true,
      message: 'Password has been successfully updated. You can now log in.'
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    return res.status(500).json({ success: false, message: 'Could not reset password.' });
  }
};

/**
 * Update language preference
 */
const updateLanguage = async (req, res) => {
  try {
    const { languagePreference } = req.body;
    if (!['en', 'te'].includes(languagePreference)) {
      return res.status(400).json({ success: false, message: 'Language must be "en" or "te".' });
    }

    await User.findByIdAndUpdate(req.user._id, { languagePreference });
    return res.json({ success: true, message: 'Language preference saved.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateLanguage
};
