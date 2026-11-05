const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['farmer', 'institution', 'admin'],
      required: [true, 'Role is required']
    },
    status: {
      type: String,
      enum: [
        'pending_approval',
        'approved',
        'rejected',
        'suspended',
        'deactivation_requested',
        'deactivated'
      ],
      default: 'pending_approval',
      index: true
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    suspensionReason: {
      type: String,
      default: ''
    },
    deactivationReason: {
      type: String,
      default: ''
    },
    languagePreference: {
      type: String,
      enum: ['en', 'te'],
      default: 'en'
    },
    profile: {
      fullName: { type: String, trim: true },
      institutionName: { type: String, trim: true },
      contactPerson: { type: String, trim: true },
      phone: { type: String, trim: true },
      villageTown: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true, default: 'Andhra Pradesh' }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    isDemoAccount: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to return public profile (sanitizes private contact details unless explicitly authorized)
userSchema.methods.toSafeObject = function (includePrivateContact = false) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;

  if (!includePrivateContact && this.role !== 'admin') {
    if (obj.profile) {
      delete obj.profile.phone;
    }
    delete obj.email;
  }
  return obj;
};

module.exports = mongoose.model('User', userSchema);
