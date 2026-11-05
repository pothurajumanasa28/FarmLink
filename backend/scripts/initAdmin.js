const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../src/models/User');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const initAdmin = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('[Error] MONGODB_URI is not set in .env file.');
      process.exit(1);
    }

    mongoUri = mongoUri.replace(/^MONGODB_URI=\s*/i, '').trim();

    if (mongoUri.includes('<') && mongoUri.includes('>')) {
      mongoUri = mongoUri.replace(/<([^>]+)>/g, '$1');
    }

    if (mongoUri.includes('.mongodb.net/') && !mongoUri.includes('.mongodb.net/farm_procurement')) {
      mongoUri = mongoUri.replace('.mongodb.net/', '.mongodb.net/farm_procurement');
      if (!mongoUri.includes('?')) {
        mongoUri += '?retryWrites=true&w=majority';
      }
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('[Init Admin] Connected to MongoDB.');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@srgrec.edu.in').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('[Init Admin Error] ADMIN_PASSWORD environment variable is required to provision the admin account.');
      console.error('Please set ADMIN_PASSWORD in your .env file with a strong password (at least 8 characters).');
      process.exit(1);
    }

    if (adminPassword.length < 8) {
      console.error('[Init Admin Error] ADMIN_PASSWORD must be at least 8 characters long for security compliance.');
      process.exit(1);
    }

    const adminName = process.env.ADMIN_NAME || 'FarmLink Platform Admin';
    const adminPhone = process.env.ADMIN_PHONE || '+919876543210';
    const allowOverwrite = process.env.OVERWRITE_EXISTING_ADMIN === 'true' || process.argv.includes('--force');

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      if (!allowOverwrite) {
        console.log(`[Init Admin] Existing admin account found for ${adminEmail}.`);
        console.log('[Init Admin] Overwrite protected. Pass OVERWRITE_EXISTING_ADMIN=true or --force if you intentionally wish to reset this account.');
        await mongoose.disconnect();
        process.exit(0);
      }

      console.log(`[Init Admin] Overwrite allowed: Updating admin account for ${adminEmail}...`);
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.status = 'approved';
      admin.profile = {
        fullName: adminName,
        phone: adminPhone,
        villageTown: admin.profile?.villageTown || 'Gudlavalleru',
        district: admin.profile?.district || 'Krishna',
        state: admin.profile?.state || 'Andhra Pradesh'
      };
      await admin.save();
      console.log('[Init Admin] Admin account successfully updated.');
    } else {
      console.log(`[Init Admin] Creating new admin account for ${adminEmail}...`);
      admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        status: 'approved',
        profile: {
          fullName: adminName,
          phone: adminPhone,
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        }
      });
      console.log('[Init Admin] Admin account successfully created.');
    }

    console.log('========================================================');
    console.log('FarmLink Admin Account Status:');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Role:     admin`);
    console.log(`Status:   approved`);
    console.log('Password: [REDACTED FOR SECURITY]');
    console.log('========================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Init Admin Error]', err);
    process.exit(1);
  }
};

initAdmin();
