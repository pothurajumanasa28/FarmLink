const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS resolving querySrv ECONNREFUSED for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in backend/.env file');
    }

    uri = uri.replace(/^MONGODB_URI=\s*/i, '').trim();

    // Auto-fix: Remove accidental < and > brackets around password if the user left them in
    // e.g. <db_leelesh28> -> db_leelesh28
    if (uri.includes('<') && uri.includes('>')) {
      uri = uri.replace(/<([^>]+)>/g, '$1');
    }

    // Ensure database name is included
    if (uri.includes('.mongodb.net/') && !uri.includes('.mongodb.net/farm_procurement')) {
      uri = uri.replace('.mongodb.net/', '.mongodb.net/farm_procurement');
      if (!uri.includes('?')) {
        uri += '?retryWrites=true&w=majority';
      }
    }

    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Could not connect to MongoDB: ${error.message}`);
    console.log('\n--- HOW TO FIX THIS DATABASE ERROR ---');
    console.log('1. Make sure you removed the "<" and ">" symbols from your password in backend/.env');
    console.log('2. In MongoDB Atlas, go to "Network Access" -> click "Add IP Address" -> choose "Allow Access from Anywhere" (0.0.0.0/0)');
    console.log('3. In MongoDB Atlas, go to "Database Access" to ensure your username and password are correct.');
    console.log('--------------------------------------\n');
    process.exit(1);
  }
};

module.exports = connectDB;
