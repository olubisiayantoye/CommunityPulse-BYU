import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

// 🔐 Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'CommunityPulse',
      audience: 'community-pulse-users'
    }
  );
};

// 🍪 Set JWT as HTTP-Only Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  const userObj = user.toObject();
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      data: {
        user: userObj,
        token
      },
      message: 'Authentication successful'
    });
};

// 🚀 REGISTER
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, organization, role = 'member' } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      organization,
      role: role === 'admin' ? 'admin' : 'member',
      isVerified: process.env.NODE_ENV !== 'production'
    });

    sendTokenResponse(user, 201, res);

  } catch (error) {
    console.error('❌ Registration Error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// 🔑 LOGIN
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// 🚪 LOGOUT
export const logout = (req, res) => {
  res
    .cookie('token', 'none', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(Date.now() + 10 * 1000)
    })
    .status(200)
    .json({ success: true, data: {}, message: 'Logged out successfully' });
};

// 👤 GET ME
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: { user: user.toPublicJSON() }
    });
  } catch (error) {
    console.error('❌ GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// ✏️ UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar, preferences } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.updateProfile({ name, bio, avatar, preferences });

    res.status(200).json({
      success: true,
      data: { user: user.toPublicJSON() },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// 🔐 CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error changing password' });
  }
};

// 📧 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    // TODO: Implement email sending with your email service
    console.log('📧 Password reset URL:', resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.'
    });

  } catch (error) {
    console.error('❌ Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing request' });
  }
};

// 🔁 RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide token and new password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });

  } catch (error) {
    console.error('❌ Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

// ✅ VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required' });
    }

    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken: verificationTokenHash,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    if (req.user) {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now sign in.'
      });
    }

  } catch (error) {
    console.error('❌ Verify Email Error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying email' });
  }
};

// 🔄 RESEND VERIFICATION
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // TODO: Implement email sending
    console.log('📧 Verification email would be sent to:', email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error) {
    console.error('❌ Resend Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error sending verification email' });
  }
};

// 🗑️ DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmDelete } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({ success: false, message: 'Please confirm account deletion' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password incorrect' });
    }

    await User.softDelete(user._id);

    res
      .cookie('token', 'none', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + 10 * 1000)
      })
      .status(200)
      .json({ success: true, message: 'Account deleted successfully' });

  } catch (error) {
    console.error('❌ Delete Account Error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting account' });
  }
};