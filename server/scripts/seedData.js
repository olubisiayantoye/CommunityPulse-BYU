import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';

dotenv.config();

// =============================================================================
// 📦 SAMPLE DATA
// =============================================================================

const sampleFeedback = [
  {
    content: "The new community center hours are perfect! Really appreciate the extended evening access.",
    category: "Facilities",
    sentiment: { label: "POSITIVE", score: 0.9876 },
    keywords: ["hours", "community", "center", "access", "evening"],
    upvoteCount: 12,
    status: "Resolved"
  },
  {
    content: "Parking near the main entrance is always full by 9am. Very frustrating for early meetings.",
    category: "Facilities",
    sentiment: { label: "NEGATIVE", score: 0.9234 },
    keywords: ["parking", "entrance", "full", "frustrating", "meetings"],
    upvoteCount: 18,
    status: "In Progress"
  },
  {
    content: "Love the new newsletter format! Much easier to read on mobile.",
    category: "Communication",
    sentiment: { label: "POSITIVE", score: 0.9654 },
    keywords: ["newsletter", "format", "mobile", "read", "easier"],
    upvoteCount: 8,
    status: "Resolved"
  },
  {
    content: "The leadership team seems disconnected from member concerns. Would appreciate more town halls.",
    category: "Leadership",
    sentiment: { label: "NEGATIVE", score: 0.8921 },
    keywords: ["leadership", "disconnected", "concerns", "town", "halls"],
    upvoteCount: 24,
    status: "Pending"
  },
  {
    content: "Great job on the holiday event! The kids had a wonderful time.",
    category: "Events",
    sentiment: { label: "POSITIVE", score: 0.9512 },
    keywords: ["holiday", "event", "kids", "wonderful", "time"],
    upvoteCount: 15,
    status: "Resolved"
  },
  {
    content: "The playground equipment needs safety inspection. Some parts are loose.",
    category: "Safety",
    sentiment: { label: "NEGATIVE", score: 0.8765 },
    keywords: ["playground", "equipment", "safety", "inspection", "loose"],
    upvoteCount: 31,
    status: "In Progress"
  },
  {
    content: "Would love to see more vegetarian options at community meals.",
    category: "Events",
    sentiment: { label: "NEUTRAL", score: 0.7234 },
    keywords: ["vegetarian", "options", "community", "meals"],
    upvoteCount: 9,
    status: "Pending"
  },
  {
    content: "The website is hard to navigate on mobile. Please improve the design.",
    category: "Communication",
    sentiment: { label: "NEGATIVE", score: 0.8432 },
    keywords: ["website", "navigate", "mobile", "improve", "design"],
    upvoteCount: 14,
    status: "Pending"
  },
  {
    content: "Thank you for the quick response to my last concern. Very professional!",
    category: "Leadership",
    sentiment: { label: "POSITIVE", score: 0.9723 },
    keywords: ["quick", "response", "concern", "professional"],
    upvoteCount: 6,
    status: "Resolved"
  },
  {
    content: "The lighting in the parking lot is insufficient at night. Safety concern.",
    category: "Safety",
    sentiment: { label: "NEGATIVE", score: 0.9123 },
    keywords: ["lighting", "parking", "lot", "night", "safety"],
    upvoteCount: 22,
    status: "In Progress"
  },
  {
    content: "More workshops on financial literacy would be valuable for our community.",
    category: "Events",
    sentiment: { label: "POSITIVE", score: 0.8234 },
    keywords: ["workshops", "financial", "literacy", "valuable", "community"],
    upvoteCount: 11,
    status: "Pending"
  },
  {
    content: "Email notifications are too frequent. Would prefer a weekly digest option.",
    category: "Communication",
    sentiment: { label: "NEUTRAL", score: 0.6543 },
    keywords: ["email", "notifications", "frequent", "weekly", "digest"],
    upvoteCount: 7,
    status: "Pending"
  },
  {
    content: "The new recycling program is excellent! Easy to use and well-organized.",
    category: "Facilities",
    sentiment: { label: "POSITIVE", score: 0.9645 },
    keywords: ["recycling", "program", "excellent", "easy", "organized"],
    upvoteCount: 19,
    status: "Resolved"
  },
  {
    content: "Meeting times often conflict with work schedules. Need more evening options.",
    category: "Leadership",
    sentiment: { label: "NEGATIVE", score: 0.7891 },
    keywords: ["meeting", "times", "conflict", "work", "evening"],
    upvoteCount: 16,
    status: "Pending"
  },
  {
    content: "The community garden is thriving! Great initiative by the volunteers.",
    category: "Facilities",
    sentiment: { label: "POSITIVE", score: 0.9456 },
    keywords: ["garden", "thriving", "great", "initiative", "volunteers"],
    upvoteCount: 13,
    status: "Resolved"
  },
  {
    content: "Security cameras near the entrance would help deter vandalism.",
    category: "Safety",
    sentiment: { label: "NEUTRAL", score: 0.7123 },
    keywords: ["security", "cameras", "entrance", "deter", "vandalism"],
    upvoteCount: 20,
    status: "Pending"
  },
  {
    content: "The monthly newsletter is informative and well-written. Keep it up!",
    category: "Communication",
    sentiment: { label: "POSITIVE", score: 0.9321 },
    keywords: ["newsletter", "informative", "well-written", "keep", "up"],
    upvoteCount: 5,
    status: "Resolved"
  },
  {
    content: "Would appreciate more transparency on how community funds are allocated.",
    category: "Leadership",
    sentiment: { label: "NEGATIVE", score: 0.8234 },
    keywords: ["transparency", "community", "funds", "allocated"],
    upvoteCount: 27,
    status: "In Progress"
  },
  {
    content: "The summer concert series was amazing! Hope to see more events like this.",
    category: "Events",
    sentiment: { label: "POSITIVE", score: 0.9812 },
    keywords: ["summer", "concert", "series", "amazing", "events"],
    upvoteCount: 25,
    status: "Resolved"
  },
  {
    content: "The restroom facilities need more frequent cleaning during peak hours.",
    category: "Facilities",
    sentiment: { label: "NEGATIVE", score: 0.8567 },
    keywords: ["restroom", "facilities", "cleaning", "frequent", "peak"],
    upvoteCount: 17,
    status: "Pending"
  }
];

// =============================================================================
// 🌱 SEED DATABASE FUNCTION
// =============================================================================

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Feedback.deleteMany({});
    console.log('🧹 Cleared existing data');

    // =============================================================================
    // 👥 CREATE ADMIN USERS (with required organization field)
    // =============================================================================
    
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admins = await User.insertMany([
      {
        name: "Alex Rivera",
        email: "admin@communitypulse.dev",
        password: adminPassword,
        role: "admin",
        organization: "CommunityPulse Demo Organization", // ✅ REQUIRED FIELD
        isVerified: true,
        isActive: true
      },
      {
        name: "Jordan Lee",
        email: "moderator@communitypulse.dev",
        password: adminPassword,
        role: "moderator",
        organization: "CommunityPulse Demo Organization", // ✅ REQUIRED FIELD
        isVerified: true,
        isActive: true
      }
    ]);
    console.log(`✅ Created ${admins.length} admin users`);

    // =============================================================================
    // 👥 CREATE MEMBER USERS (with required organization field)
    // =============================================================================
    
    const memberPassword = await bcrypt.hash('Member123!', 12);
    const members = await User.insertMany([
      {
        name: "Taylor Kim",
        email: "member1@demo.com",
        password: memberPassword,
        role: "member",
        organization: "CommunityPulse Demo Organization", // ✅ REQUIRED FIELD
        isVerified: true,
        isActive: true
      },
      {
        name: "Casey Morgan",
        email: "member2@demo.com",
        password: memberPassword,
        role: "member",
        organization: "CommunityPulse Demo Organization", // ✅ REQUIRED FIELD
        isVerified: true,
        isActive: true
      },
      {
        name: "Riley Chen",
        email: "member3@demo.com",
        password: memberPassword,
        role: "member",
        organization: "CommunityPulse Demo Organization", // ✅ REQUIRED FIELD
        isVerified: true,
        isActive: true
      },
      {
        name: "Avery Patel",
        email: "member4@demo.com",
        password: memberPassword,
        role: "member",
        organization: "CommunityPulse Demo Organization", // ✅ REQUIRED FIELD
        isVerified: true,
        isActive: true
      }
    ]);
    console.log(`✅ Created ${members.length} member users`);

    // =============================================================================
    // 📝 CREATE FEEDBACK ENTRIES
    // =============================================================================
    
    const feedbackDocs = sampleFeedback.map(fb => ({
      ...fb,
      isAnonymous: true,
      submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
    }));
    
    await Feedback.insertMany(feedbackDocs);
    console.log(`✅ Seeded ${feedbackDocs.length} feedback entries`);

    // =============================================================================
    // 🎯 DISPLAY DEMO CREDENTIALS
    // =============================================================================
    
    console.log('\n🎯 Demo Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('👑 Admin:');
    console.log('   Email: admin@communitypulse.dev');
    console.log('   Password: Admin123!');
    console.log('');
    console.log('🔐 Moderator:');
    console.log('   Email: moderator@communitypulse.dev');
    console.log('   Password: Admin123!');
    console.log('');
    console.log('👤 Members (any of these):');
    console.log('   Email: member1@demo.com | member2@demo.com | member3@demo.com | member4@demo.com');
    console.log('   Password: Member123!');
    console.log('═══════════════════════════════════════\n');

    console.log('✨ Database seeded successfully!');
    
    // Close connection
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed Error:', error);
    
    // Helpful troubleshooting tips
    if (error.errors?.organization) {
      console.log('\n💡 Fix: Ensure all user objects include the "organization" field:');
      console.log('   organization: "Your Organization Name"');
    }
    
    process.exit(1);
  }
};

// =============================================================================
// 🚀 RUN SEED
// =============================================================================

seedDatabase();