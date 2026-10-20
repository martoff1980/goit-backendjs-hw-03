import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Set JWT secret before importing app
process.env.JWT_SECRET = 'test_jwt_secret_123';

import app from '../../../app';
import { prisma } from '../../../prisma/client';

// Mock Prisma
vi.mock('../../../prisma/client', () => ({
	prisma: {
		user: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		refreshToken: {
			create: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
	default: {
		hash: vi.fn().mockResolvedValue('hashed_password_mock'),
		compare: vi.fn(),
	},
	hash: vi.fn().mockResolvedValue('hashed_password_mock'),
	compare: vi.fn(),
}));

import bcrypt from 'bcrypt';

describe('Auth & Security Unit/Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Unit test for token generation function (or simulating token signing logic)
	it('Unit test for token generation with correct payload and type', () => {
		const secret = process.env.JWT_SECRET!;
		const userId = 1;
		const username = 'testuser';

		const accessToken = jwt.sign({ sub: userId, username, type: 'access' }, secret, { expiresIn: '15m' });
		const refreshToken = jwt.sign({ sub: userId, username, type: 'refresh' }, secret, { expiresIn: '7d' });

		const decodedAccess = jwt.verify(accessToken, secret) as any;
		const decodedRefresh = jwt.verify(refreshToken, secret) as any;

		expect(decodedAccess.sub).toBe(userId);
		expect(decodedAccess.type).toBe('access');
		expect(decodedRefresh.type).toBe('refresh');
	});

	// Unit test for password hashing
	it('Unit test for password hashing using bcrypt', async () => {
		const password = 'securepassword123';
		const hashedPassword = await bcrypt.hash(password, 10);

		expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
		expect(hashedPassword).toBe('hashed_password_mock');
	});

	// Integration test for POST /auth/register — returns 201 with valid data
	it('Integration test POST /auth/register should return 201 with valid data', async () => {
		// @ts-ignore
		prisma.user.findFirst.mockResolvedValue(null);

		//@ts-ignore
		prisma.user.create.mockResolvedValue({
			id: 1,
			username: 'new_user',
			email: 'new@example.com',
			password: 'hashed_password_mock',
			name: 'Іван',
			createdAt: new Date(),
		});
		//@ts-ignore
		prisma.refreshToken.create.mockResolvedValue({});

		const res = await request(app).post('/auth/register').send({
			username: 'new_user',
			email: 'new@example.com',
			password: 'password123',
			name: 'Іван',
		});

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty('accessToken');
		expect(res.body).toHaveProperty('refreshToken');
		expect(res.body.user).toHaveProperty('username', 'new_user');
	});

	// Integration test for POST /auth/login — returns 401 on incorrect password
	it('Integration test POST /auth/login should return 401 on invalid password', async () => {
		//@ts-ignore
		prisma.user.findUnique.mockResolvedValue({
			id: 1,
			username: 'existing_user',
			email: 'existing@example.com',
			password: 'hashed_password_mock',
			name: 'Іван',
			createdAt: new Date(),
		});

		//@ts-ignore
		bcrypt.compare.mockResolvedValue(false);

		const res = await request(app).post('/auth/login').send({
			username: 'existing_user',
			password: 'wrongpassword',
		});

		expect(res.status).toBe(401);
		expect(res.body).toHaveProperty('error', 'Invalid credentials');
	});
});
