
async function run() {
    const API_URL = 'http://localhost:5000/api';

    console.log('--- Fetching Users ---');
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        const testUser = users.find(u => u.username === 'testuser99');

        if (testUser) {
            console.log(`\n--- Promoting testuser99 (using username: ${testUser.username}) ---`);
            const res2 = await fetch(`${API_URL}/admin/set-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: testUser.username, role: 'staff' })
            });
            const updated = await res2.json();
            console.log('Response:', updated);
        } else {
            console.log('testuser99 not found.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
