import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Session from '../src/models/Session.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Session.deleteMany({});
});

describe('Auth Endpoints', () => {
  const patientData = {
    name: 'Test Patient',
    email: 'patient@test.com',
    password: 'password123',
    phone: '1234567890',
    gender: 'male',
    role: 'patient'
  };

  describe('POST /api/auth/register-patient', () => {
    it('should register a new patient and return cookies', async () => {
      const res = await request(app)
        .post('/api/auth/register-patient')
        .send(patientData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      
      // Check cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('accessToken='))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken='))).toBe(true);
      expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true);
    });

    it('should fail with validation error if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register-patient')
        .send({ ...patientData, email: '' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register-patient').send(patientData);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: patientData.email, password: patientData.password, role: 'patient' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.user.email).toEqual(patientData.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: patientData.email, password: 'wrongpassword', role: 'patient' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
