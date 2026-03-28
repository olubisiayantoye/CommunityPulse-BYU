import axios from 'axios';

const API = 'http://localhost:5000/api';

const testAPI = async () => {
  console.log('🧪 Testing CommunityPulse API...\n');

  try {
    // 1. Login
    console.log('🔑 Logging in as admin...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@communitypulse.dev',
      password: 'Admin123!'
    }, { withCredentials: true });

    console.log('✅ Login successful!');
    console.log('📦 User:', loginRes.data.data.user.name);
    
    const token = loginRes.data.data.token;

    // 2. Get current user
    console.log('\n👤 Fetching user profile...');
    const meRes = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
    console.log('✅ Profile:', meRes.data.data.user);

    // 3. Get feedback list
    console.log('\n📋 Fetching feedback...');
    const feedbackRes = await axios.get(`${API}/feedback?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
    console.log(`✅ Found ${feedbackRes.data.data.pagination.totalItems} feedback items`);
    console.log('📄 Sample feedback:');
    feedbackRes.data.data.feedback.slice(0, 2).forEach((fb, i) => {
      console.log(`   ${i+1}. [${fb.sentiment.label}] ${fb.content.substring(0, 60)}...`);
    });

    // 4. Submit new feedback
    console.log('\n📝 Submitting test feedback...');
    const submitRes = await axios.post(`${API}/feedback`, {
      content: 'API test successful! The feedback system is working great.',
      category: 'Communication'
    }, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
    console.log('✅ Feedback submitted with ID:', submitRes.data.data.feedback._id);

    console.log('\n🎉 All API tests passed! Your backend is working perfectly.');

  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

testAPI();