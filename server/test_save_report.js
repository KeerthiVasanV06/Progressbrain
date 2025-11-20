import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function test() {
  try {
    // 1. Register a test user
    console.log('\n[1] Registering test user...');
    const registerRes = await API.post('/api/users/register', {
      username: 'testuser' + Date.now(),
      email: `test-${Date.now()}@test.com`,
      password: 'password123',
    });
    const token = registerRes.data.token;
    const userId = registerRes.data.user._id;
    console.log(`✓ Registered user: ${userId}`);
    console.log(`✓ Token: ${token}`);

    // 2. Add token to headers for subsequent requests
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3. Start a session
    console.log('\n[2] Starting a study session...');
    const startRes = await API.post('/api/study-sessions/start', {
      subject: 'Math',
      topic: 'Algebra',
      plannedDuration: 3600,
    });
    const sessionId = startRes.data.session._id;
    console.log(`✓ Session created: ${sessionId}`);
    console.log(`✓ Initial notes: "${startRes.data.session.notes}"`);

    // 4. Save a report
    console.log('\n[3] Saving report to session...');
    const reportRes = await API.patch(`/api/study-sessions/${sessionId}/report`, {
      notes: 'This is my test report about Algebra',
    });
    console.log(`✓ Report saved`);
    console.log(`✓ Returned notes: "${reportRes.data.session.notes}"`);

    // 5. Fetch the session to verify notes were saved
    console.log('\n[4] Verifying session in database...');
    const getRes = await API.get(`/api/study-sessions/${sessionId}`);
    console.log(`✓ Fetched session from DB`);
    console.log(`✓ Database notes: "${getRes.data.session.notes}"`);

    if (getRes.data.session.notes === 'This is my test report about Algebra') {
      console.log('\n✅ SUCCESS: Report was saved correctly!');
    } else {
      console.log('\n❌ FAILURE: Report was NOT saved to database!');
      console.log(`Expected: "This is my test report about Algebra"`);
      console.log(`Got: "${getRes.data.session.notes}"`);
    }
  } catch (err) {
    console.error('❌ ERROR:', err.response?.data || err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

test();
