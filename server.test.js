const request = require('supertest');
const app = require('./server');

describe('API Endpoints', () => {
    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const res = await request(app)
                .get('/api/health')
                .expect(200);
            
            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('version');
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/users')
                .send(userData)
                .expect(201);
            
            expect(res.body).toHaveProperty('username', userData.username);
            expect(res.body).toHaveProperty('email', userData.email);
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ username: 'testuser' })
                .expect(400);
            
            expect(res.body).toHaveProperty('error', 'Missing required fields');
        });
    });

    describe('GET /api/users', () => {
        it('should return list of users', async () => {
            const res = await request(app)
                .get('/api/users')
                .expect(200);
            
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
