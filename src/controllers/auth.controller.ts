import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import logger from '../logger';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const generateTokens = async (userId: number, username: string) => {
	const accessToken = jwt.sign({ id: userId, username, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
	// Add jwtid with crypto.randomUUID() to guarantee uniqueness even within the same millisecond
	const refreshToken = jwt.sign({ id: userId, username, type: 'refresh' }, JWT_SECRET, {
		expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d`,
		jwtid: crypto.randomUUID(),
	});

	// Store refresh token in DB with token rotation / replacement
	await prisma.refreshToken.create({
		data: {
			token: refreshToken,
			userId,
		},
	});

	return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
	const { username, email, password, name } = req.body;

	const existingUser = await prisma.user.findFirst({
		where: { OR: [{ username }, { email }] },
	});

	if (existingUser) {
		return res.status(409).json({ error: 'Username or email already taken' });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = await prisma.user.create({
		data: {
			username,
			email,
			password: hashedPassword,
			name,
		},
	});

	const { accessToken, refreshToken } = await generateTokens(user.id, user.username);

	logger.info({ userId: user.id, username: user.username }, 'User registered successfully');

	return res.status(201).json({
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
		},
		accessToken,
		refreshToken,
	});
});

export const login = asyncHandler(async (req: Request, res: Response) => {
	const { username, password } = req.body;

	const user = await prisma.user.findUnique({ where: { username } });
	if (!user) {
		return res.status(401).json({ error: 'Invalid credentials' });
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		return res.status(401).json({ error: 'Invalid credentials' });
	}

	// Delete previous refresh tokens for this user upon login as per requirement
	await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

	// Replace old refresh tokens or add new one
	const { accessToken, refreshToken } = await generateTokens(user.id, user.username);

	logger.info({ userId: user.id, username: user.username }, 'User logged in successfully');

	return res.status(200).json({
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			name: user.name,
		},
		accessToken,
		refreshToken,
	});
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
	const { refreshToken } = req.body;

	try {
		const payload = jwt.verify(refreshToken, JWT_SECRET) as unknown as { id: number; username: string };

		const storedToken = await prisma.refreshToken.findUnique({
			where: { token: refreshToken },
		});

		if (!storedToken) {
			return res.status(401).json({ error: 'Invalid refresh token' });
		}

		// Token rotation: delete old refresh token and create a new pair
		await prisma.refreshToken.delete({ where: { id: storedToken.id } });

		const tokens = await generateTokens(payload.id, payload.username);

		return res.status(200).json(tokens);
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired refresh token' });
	}
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user?.id;
	if (userId) {
		await prisma.refreshToken.deleteMany({ where: { userId } });
	}
	return res.status(204).end();
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user?.id;
	const user = await prisma.user.findUnique({ where: { id: userId } });

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	return res.status(200).json({
		id: user.id,
		username: user.username,
		email: user.email,
		name: user.name,
		createdAt: user.createdAt,
	});
});
