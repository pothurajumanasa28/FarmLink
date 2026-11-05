const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../src/models/User');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const ProduceListing = require('../src/models/ProduceListing');
const BulkRequirement = require('../src/models/BulkRequirement');
const BulkOffer = require('../src/models/BulkOffer');
const Order = require('../src/models/Order');
const Feedback = require('../src/models/Feedback');
const Notification = require('../src/models/Notification');
const AuditLog = require('../src/models/AuditLog');

const seedData = async () => {
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
    console.log('[Seed] Connected to MongoDB.');

    // Remove existing demo records
    console.log('[Seed] Cleaning up previous demo records...');
    await User.deleteMany({ isDemoAccount: true });
    await ProduceListing.deleteMany({ isDemoRecord: true });
    await BulkRequirement.deleteMany({ isDemoRecord: true });
    await BulkOffer.deleteMany({ isDemoRecord: true });
    await Order.deleteMany({ isDemoRecord: true });

    console.log('[Seed] Seeding 3 Demo Farmers...');
    const farmers = await User.create([
      {
        email: 'farmer.ramesh@srgrec.demo',
        password: 'FarmerPass123!',
        role: 'farmer',
        status: 'approved',
        languagePreference: 'te',
        isDemoAccount: true,
        profile: {
          fullName: 'Ramesh Reddy (రమేష్ రెడ్డి)',
          phone: '+919848022334',
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        }
      },
      {
        email: 'farmer.venkata@srgrec.demo',
        password: 'FarmerPass123!',
        role: 'farmer',
        status: 'approved',
        languagePreference: 'te',
        isDemoAccount: true,
        profile: {
          fullName: 'Venkata Rao (వెంకట రావు)',
          phone: '+919848133445',
          villageTown: 'Angalur',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        }
      },
      {
        email: 'farmer.lakshmi@srgrec.demo',
        password: 'FarmerPass123!',
        role: 'farmer',
        status: 'approved',
        languagePreference: 'en',
        isDemoAccount: true,
        profile: {
          fullName: 'Lakshmi Devi (లక్ష్మీ దేవి)',
          phone: '+919848244556',
          villageTown: 'Mudinepalli',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        }
      }
    ]);

    console.log('[Seed] Seeding 2 Demo Institutions...');
    const institutions = await User.create([
      {
        email: 'hostel@srgrec.demo',
        password: 'HostelPass123!',
        role: 'institution',
        status: 'approved',
        languagePreference: 'en',
        isDemoAccount: true,
        profile: {
          institutionName: 'SRGEC Boys Hostel Mess',
          contactPerson: 'K. Srinivasa Rao (Warden)',
          phone: '+919440155667',
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        }
      },
      {
        email: 'canteen@srgrec.demo',
        password: 'CanteenPass123!',
        role: 'institution',
        status: 'approved',
        languagePreference: 'en',
        isDemoAccount: true,
        profile: {
          institutionName: 'SRGEC Central Campus Canteen',
          contactPerson: 'M. Subba Rao (Manager)',
          phone: '+919440266778',
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        }
      }
    ]);

    // Next week availability date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    console.log('[Seed] Seeding 6 Produce Listings...');
    const listings = await ProduceListing.create([
      {
        farmer: farmers[0]._id,
        produceName: 'BPT Sona Masoori Rice (బియ్యం)',
        totalQuantity: 1200,
        reservedQuantity: 200, // 200 reserved for accepted demo orders
        quantityUnit: 'kg',
        pricePerUnit: 54,
        villageTown: 'Gudlavalleru',
        district: 'Krishna',
        state: 'Andhra Pradesh',
        availabilityDate: futureDate,
        status: 'active',
        description: 'Premium quality aged BPT 5204 raw rice directly harvested from Krishna delta paddy fields.',
        isDemoRecord: true
      },
      {
        farmer: farmers[0]._id,
        produceName: 'Black Gram / Minapappu (మినపప్పు)',
        totalQuantity: 350,
        reservedQuantity: 0,
        quantityUnit: 'kg',
        pricePerUnit: 110,
        villageTown: 'Gudlavalleru',
        district: 'Krishna',
        state: 'Andhra Pradesh',
        availabilityDate: futureDate,
        status: 'active',
        description: 'First quality unpolished black gram suitable for hostel breakfast idli and dosa.',
        isDemoRecord: true
      },
      {
        farmer: farmers[1]._id,
        produceName: 'Fresh Farm Tomatoes (టమాటాలు)',
        totalQuantity: 500,
        reservedQuantity: 50,
        quantityUnit: 'kg',
        pricePerUnit: 24,
        villageTown: 'Angalur',
        district: 'Krishna',
        state: 'Andhra Pradesh',
        availabilityDate: futureDate,
        status: 'active',
        description: 'Organically grown ripe cooking tomatoes harvested daily morning.',
        isDemoRecord: true
      },
      {
        farmer: farmers[1]._id,
        produceName: 'Fresh Green Chillies (పచ్చి మిరపకాయలు)',
        totalQuantity: 80,
        reservedQuantity: 0,
        quantityUnit: 'kg',
        pricePerUnit: 48,
        villageTown: 'Angalur',
        district: 'Krishna',
        state: 'Andhra Pradesh',
        availabilityDate: futureDate,
        status: 'active',
        description: 'Hot and spicy local green chillies.',
        isDemoRecord: true
      },
      {
        farmer: farmers[2]._id,
        produceName: 'Fresh Buffalo Milk (గేదె పాలు)',
        totalQuantity: 200,
        reservedQuantity: 0,
        quantityUnit: 'litres',
        pricePerUnit: 65,
        villageTown: 'Mudinepalli',
        district: 'Krishna',
        state: 'Andhra Pradesh',
        availabilityDate: futureDate,
        status: 'active',
        description: 'Pure 7.5% fat buffalo milk, unadulterated, direct from dairy farm.',
        isDemoRecord: true
      },
      {
        farmer: farmers[2]._id,
        produceName: 'Organic Robusta Bananas (అరటి పండ్లు)',
        totalQuantity: 15,
        reservedQuantity: 0,
        quantityUnit: 'quintal',
        pricePerUnit: 1800,
        villageTown: 'Mudinepalli',
        district: 'Krishna',
        state: 'Andhra Pradesh',
        availabilityDate: futureDate,
        status: 'active',
        description: 'Sweet, natural Cavendish and Robusta bananas for student breakfast and snack.',
        isDemoRecord: true
      }
    ]);

    console.log('[Seed] Seeding 3 Institutional Bulk Requirements...');
    const bulkRequirements = await BulkRequirement.create([
      {
        institution: institutions[0]._id, // Hostel
        produceName: 'Sona Masoori Rice (బియ్యం)',
        requiredQuantity: 600,
        quantityUnit: 'kg',
        requiredDate: futureDate,
        location: {
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        },
        targetPricePerUnit: 52,
        description: 'Requirement for college boys hostel monthly dining mess.',
        status: 'open',
        isDemoRecord: true
      },
      {
        institution: institutions[1]._id, // Canteen
        produceName: 'Cooking Tomatoes (టమాటాలు)',
        requiredQuantity: 250,
        quantityUnit: 'kg',
        requiredDate: futureDate,
        location: {
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        },
        targetPricePerUnit: 22,
        description: 'Weekly bulk supply for central campus canteen food preparation.',
        status: 'open',
        isDemoRecord: true
      },
      {
        institution: institutions[0]._id, // Hostel
        produceName: 'Fresh Buffalo Milk (పాలు)',
        requiredQuantity: 150,
        quantityUnit: 'litres',
        requiredDate: futureDate,
        location: {
          villageTown: 'Gudlavalleru',
          district: 'Krishna',
          state: 'Andhra Pradesh'
        },
        targetPricePerUnit: 62,
        description: 'Morning and evening tea/coffee and curd requirements for hostel residents.',
        status: 'open',
        isDemoRecord: true
      }
    ]);

    console.log('[Seed] Seeding 4 Demo Orders with diverse statuses...');
    // 1. Pending Order Request
    const orderPending = await Order.create({
      orderType: 'individual_listing',
      listing: listings[2]._id, // Tomatoes
      farmer: farmers[1]._id,
      institution: institutions[0]._id,
      produceName: 'Fresh Farm Tomatoes (టమాటాలు)',
      quantity: 30,
      quantityUnit: 'kg',
      pricePerUnit: 24,
      totalAmount: 720,
      requiredDate: futureDate,
      status: 'pending',
      stockReserved: false,
      notes: 'Please deliver before 8:00 AM at Hostel Gate 2.',
      statusHistory: [
        {
          status: 'pending',
          changedBy: institutions[0]._id,
          note: 'Initial request submitted by Hostel'
        }
      ],
      isDemoRecord: true
    });

    // 2. Accepted Order (Stock reserved, contact revealed)
    const orderAccepted = await Order.create({
      orderType: 'individual_listing',
      listing: listings[0]._id, // Rice
      farmer: farmers[0]._id,
      institution: institutions[0]._id,
      produceName: 'BPT Sona Masoori Rice (బియ్యం)',
      quantity: 100,
      quantityUnit: 'kg',
      pricePerUnit: 54,
      totalAmount: 5400,
      requiredDate: futureDate,
      status: 'accepted',
      stockReserved: true,
      notes: 'College truck will pick up from Gudlavalleru farm warehouse.',
      statusHistory: [
        {
          status: 'pending',
          changedBy: institutions[0]._id,
          note: 'Initial request submitted'
        },
        {
          status: 'accepted',
          changedBy: farmers[0]._id,
          note: 'Confirmed quantity and scheduled for collection'
        }
      ],
      isDemoRecord: true
    });

    // 3. Preparing Order
    const orderPreparing = await Order.create({
      orderType: 'individual_listing',
      listing: listings[0]._id,
      farmer: farmers[0]._id,
      institution: institutions[1]._id, // Canteen
      produceName: 'BPT Sona Masoori Rice (బియ్యం)',
      quantity: 100,
      quantityUnit: 'kg',
      pricePerUnit: 54,
      totalAmount: 5400,
      requiredDate: futureDate,
      status: 'preparing',
      stockReserved: true,
      notes: 'Packing into 25kg bags underway.',
      statusHistory: [
        {
          status: 'pending',
          changedBy: institutions[1]._id,
          note: 'Order placed by Canteen Manager'
        },
        {
          status: 'accepted',
          changedBy: farmers[0]._id,
          note: 'Order confirmed'
        },
        {
          status: 'preparing',
          changedBy: farmers[0]._id,
          note: 'Grain cleaning and bagging in progress'
        }
      ],
      isDemoRecord: true
    });

    // 4. Delivered Order (with Two-way Feedback!)
    const orderDelivered = await Order.create({
      orderType: 'individual_listing',
      listing: listings[2]._id,
      farmer: farmers[1]._id,
      institution: institutions[1]._id,
      produceName: 'Fresh Farm Tomatoes (టమాటాలు)',
      quantity: 50,
      quantityUnit: 'kg',
      pricePerUnit: 24,
      totalAmount: 1200,
      requiredDate: new Date(),
      status: 'delivered',
      stockReserved: false,
      farmerFeedbackGiven: true,
      institutionFeedbackGiven: true,
      notes: 'Delivered at Canteen kitchen counter.',
      statusHistory: [
        { status: 'pending', changedBy: institutions[1]._id },
        { status: 'accepted', changedBy: farmers[1]._id },
        { status: 'preparing', changedBy: farmers[1]._id },
        { status: 'delivered', changedBy: farmers[1]._id, note: 'Received and verified by chef' }
      ],
      isDemoRecord: true
    });

    // Feedback for delivered order
    await Feedback.create([
      {
        order: orderDelivered._id,
        reviewer: institutions[1]._id,
        reviewedUser: farmers[1]._id,
        reviewerRole: 'institution',
        rating: 5,
        comment: 'Excellent fresh tomatoes! High quality and on-time delivery at the canteen.'
      },
      {
        order: orderDelivered._id,
        reviewer: farmers[1]._id,
        reviewedUser: institutions[1]._id,
        reviewerRole: 'farmer',
        rating: 5,
        comment: 'Very supportive canteen staff. Prompt gate entry and smooth delivery receipt.'
      }
    ]);

    console.log('[Seed] Demo data seeding completed successfully!');
    console.log('========================================================');
    console.log('DEMO ACCOUNTS READY:');
    console.log('Farmer 1:       farmer.ramesh@srgrec.demo     / FarmerPass123!');
    console.log('Farmer 2:       farmer.venkata@srgrec.demo    / FarmerPass123!');
    console.log('Farmer 3:       farmer.lakshmi@srgrec.demo    / FarmerPass123!');
    console.log('Institution 1:  hostel@srgrec.demo            / HostelPass123!');
    console.log('Institution 2:  canteen@srgrec.demo           / CanteenPass123!');
    console.log('========================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
