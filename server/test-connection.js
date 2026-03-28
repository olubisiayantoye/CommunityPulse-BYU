import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔌 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log('📦 Database:', mongoose.connection.name);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check MONGODB_URI in .env has correct username/password');
    console.log('2. Verify your IP is whitelisted in Atlas Network Access');
    console.log('3. Ensure database user has read/write permissions');
    console.log('4. Confirm cluster is running (not paused) in Atlas');
    process.exit(1);
  }
};

testConnection();