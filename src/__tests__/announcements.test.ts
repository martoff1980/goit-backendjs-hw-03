process.env.JWT_SECRET = 'super_test_secret_jwt_key_12345';

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../prisma/client';
import jwt from 'jsonwebtoken';

const generateTestToken = (userId: number, username: string) => {
	const secret = process.env.JWT_SECRET || 'test_secret';
	const payload = {
		id: userId,
		username: username,
	};
	return jwt.sign(payload, secret, { expiresIn: '1h' });
};

jest.mock('../../prisma/client', () => ({
	prisma: {
		announcement: {
			count: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		refreshToken: {
			create: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
		},
	},
}));

describe('Announcements API', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('GET /announcements should return paginated list', async () => {
		(prisma.announcement.count as jest.Mock).mockResolvedValue(1);
		(prisma.announcement.findMany as jest.Mock).mockResolvedValue([
			{
				id: 1,
				title: 'Test Announcement',
				description: 'Test description with enough length',
				price: 1000,
				category: 'sale',
				userId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
				user: { id: 1, username: 'testuser', email: 'test@example.com', name: 'Test' },
			},
		]);

		const res = await request(app).get('/announcements');
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('data');
		expect(res.body).toHaveProperty('pagination');
		expect(res.body.data.length).toBe(1);
	});

	it('GET /announcements/:id should return 404 if not found', async () => {
		(prisma.announcement.findUnique as jest.Mock).mockResolvedValue(null);

		const res = await request(app).get('/announcements/999');
		expect(res.status).toBe(404);
	});

	it('POST /announcements should fail with 401 if unauthenticated', async () => {
		const res = await request(app).post('/announcements').send({
			title: 'Valid Title',
			description: 'Valid long description here',
			price: 500,
			category: 'sale',
		});
		expect(res.status).toBe(401);
	});

	it('POST /announcements should create successfully when authenticated', async () => {
		const token = generateTestToken(1, 'owner_user');

		(prisma.announcement.create as jest.Mock).mockResolvedValue({
			id: 6,
			title: 'New Bicycle',
			description: 'Mountain bike, 21 speed',
			price: 8000,
			category: 'sale',
			userId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			user: { id: 1, username: 'owner_user', email: 'owner@example.com', name: 'Owner' },
		});

		const res = await request(app).post('/announcements').set('Authorization', `Bearer ${token}`).send({
			title: 'New Bicycle',
			description: 'Mountain bike, 21 speed',
			price: 8000,
			category: 'sale',
		});

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty('id', 6);
		expect(res.body.title).toBe('New Bicycle');
	});

	it('GET /announcements/:id should get successfully', async () => {
		(prisma.announcement.findUnique as jest.Mock).mockResolvedValue({
			id: 10,
			title: 'Test Announcement',
			description: 'Detailed description here',
			price: 500,
			category: 'sale',
			userId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			user: { id: 1, username: 'owner_user', email: 'owner@example.com', name: 'Owner' },
		});

		const res = await request(app).get('/announcements/10');

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('id', 10);
		expect(res.body.title).toBe('Test Announcement');
	});

	it('PATCH /announcements/:id should update successfully when user is owner', async () => {
		const token = generateTestToken(1, 'owner_user');

		(prisma.announcement.findUnique as jest.Mock).mockResolvedValue({
			id: 5,
			title: 'Old Title',
			description: 'Old description here',
			price: 100,
			category: 'sale',
			userId: 1,
		});

		(prisma.announcement.update as jest.Mock).mockResolvedValue({
			id: 5,
			title: 'Updated Title',
			description: 'Old description here',
			price: 100,
			category: 'sale',
			userId: 1,
			user: { id: 1, username: 'owner_user', email: 'owner@example.com', name: 'Owner' },
		});

		const res = await request(app).patch('/announcements/5').set('Authorization', `Bearer ${token}`).send({ title: 'Updated Title' });

		expect(res.status).toBe(200);
		expect(res.body.title).toBe('Updated Title');
	});

	it('PATCH /announcements/:id should return 403 if user is not the owner', async () => {
		const token = generateTestToken(2, 'other_user');

		(prisma.announcement.findUnique as jest.Mock).mockResolvedValue({
			id: 5,
			title: 'Some Title',
			description: 'Some description here',
			price: 100,
			category: 'sale',
			userId: 1, // Belongs to user 1, but user 2 is trying to update
		});

		const res = await request(app).patch('/announcements/5').set('Authorization', `Bearer ${token}`).send({ title: 'Hacked Title' });

		expect(res.status).toBe(403);
		expect(res.body).toHaveProperty('error', 'Access denied');
	});

	it('DELETE /announcements/:id should delete successfully when user is owner', async () => {
		const token = generateTestToken(1, 'owner_user');

		(prisma.announcement.findUnique as jest.Mock).mockResolvedValue({
			id: 5,
			title: 'Title to delete',
			description: 'Description here',
			price: 100,
			category: 'sale',
			userId: 1,
		});

		(prisma.announcement.delete as jest.Mock).mockResolvedValue({
			id: 5,
		});

		const res = await request(app).delete('/announcements/5').set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(204);
	});

	it('DELETE /announcements/:id should return 403 if user is not the owner', async () => {
		const token = generateTestToken(2, 'other_user');

		(prisma.announcement.findUnique as jest.Mock).mockResolvedValue({
			id: 5,
			title: 'Title to delete',
			description: 'Description here',
			price: 100,
			category: 'sale',
			userId: 1, // Belongs to user 1
		});

		const res = await request(app).delete('/announcements/5').set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(403);
		expect(res.body).toHaveProperty('error', 'Access denied');
	});
});
