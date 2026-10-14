// Set JWT secret before importing app
process.env.JWT_SECRET = 'super_test_secret_jwt_key_12345';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../../app';
import { prisma } from '../../prisma/client';

jest.mock('../../prisma/client', () => ({
	prisma: {
		user: {
			findFirst: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
		},
		refreshToken: {
			create: jest.fn(),
			findUnique: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
		},
	},
}));

jest.mock('bcrypt', () => ({
	hash: jest.fn().mockResolvedValue('hashed_password_123'),
	compare: jest.fn(),
}));

const JWT_SECRET = process.env.JWT_SECRET!;
const generateTestToken = (userId: number, username: string) => {
	return jwt.sign({ sub: userId, username }, JWT_SECRET, { expiresIn: '15m' });
};

describe('Auth API', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /auth/register', () => {
		it('should register a new user successfully and return tokens', async () => {
			(prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
			(prisma.user.create as jest.Mock).mockResolvedValue({
				id: 1,
				username: 'ivan_petrenko',
				email: 'ivan@example.com',
				password: 'hashed_password_123',
				name: 'Іван',
				createdAt: new Date(),
			});
			(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
				id: 1,
				token: 'some_refresh_token',
				userId: 1,
			});

			const res = await request(app).post('/auth/register').send({
				username: 'ivan_petrenko',
				email: 'ivan@example.com',
				password: 'securepassword',
				name: 'Іван Петренко',
			});

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('accessToken');
			expect(res.body).toHaveProperty('refreshToken');
			expect(res.body.user).toHaveProperty('username', 'ivan_petrenko');
		});

		it('should return 409 if username or email already taken', async () => {
			(prisma.user.findFirst as jest.Mock).mockResolvedValue({
				id: 1,
				username: 'ivan_petrenko',
				email: 'ivan@example.com',
			});

			const res = await request(app).post('/auth/register').send({
				username: 'ivan_petrenko',
				email: 'ivan@example.com',
				password: 'securepassword',
				name: 'Іван Петренко',
			});

			expect(res.status).toBe(409);
			expect(res.body).toHaveProperty('error', 'Username or email already taken');
		});
	});

	describe('POST /auth/login', () => {
		it('should login successfully with correct credentials', async () => {
			(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				id: 1,
				username: 'ivan_petrenko',
				email: 'ivan@example.com',
				password: 'hashed_password_123',
				name: 'Іван',
			});
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
				id: 1,
				token: 'new_refresh_token',
				userId: 1,
			});

			const res = await request(app).post('/auth/login').send({
				username: 'ivan_petrenko',
				password: 'securepassword',
			});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('accessToken');
			expect(res.body).toHaveProperty('refreshToken');
		});

		it('should return 401 on invalid credentials (wrong password or user not found)', async () => {
			(prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

			const res = await request(app).post('/auth/login').send({
				username: 'unknown_user',
				password: 'wrongpassword',
			});

			expect(res.status).toBe(401);
			expect(res.body).toHaveProperty('error', 'Invalid credentials');
		});
	});

	describe('POST /auth/refresh', () => {
		it('should refresh tokens successfully with valid refresh token', async () => {
			const validRefreshToken = jwt.sign({ sub: 1, username: 'ivan_petrenko' }, JWT_SECRET, { expiresIn: '7d' });

			(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
				id: 1,
				token: validRefreshToken,
				userId: 1,
			});
			(prisma.refreshToken.delete as jest.Mock).mockResolvedValue({ id: 1 });
			(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
				id: 2,
				token: 'new_rotated_token',
				userId: 1,
			});

			const res = await request(app).post('/auth/refresh').send({
				refreshToken: validRefreshToken,
			});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('accessToken');
			expect(res.body).toHaveProperty('refreshToken');
		});

		it('should return 401 if refresh token is not found in database', async () => {
			const validTokenNotStored = jwt.sign({ sub: 1, username: 'ivan_petrenko' }, JWT_SECRET, { expiresIn: '7d' });

			(prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

			const res = await request(app).post('/auth/refresh').send({
				refreshToken: validTokenNotStored,
			});

			expect(res.status).toBe(401);
		});
	});

	describe('POST /auth/logout', () => {
		it('should logout successfully and delete refresh tokens', async () => {
			const token = generateTestToken(1, 'ivan_petrenko');

			(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

			const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(204);
		});
	});

	describe('GET /auth/me', () => {
		it('should return current user profile when authenticated', async () => {
			const token = generateTestToken(1, 'ivan_petrenko');

			(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				id: 1,
				username: 'ivan_petrenko',
				email: 'ivan@example.com',
				name: 'Іван',
				createdAt: new Date(),
			});

			const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('username', 'ivan_petrenko');
			expect(res.body).toHaveProperty('email', 'ivan@example.com');
		});

		it('should return 401 if no authorization token provided', async () => {
			const res = await request(app).get('/auth/me');
			expect(res.status).toBe(401);
		});
	});
});
