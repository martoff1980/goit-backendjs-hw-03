import { z } from 'zod';

export const registerSchema = z.object({
	username: z.string().min(3).max(30),
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string().min(2),
});

export const loginSchema = z.object({
	username: z.string(),
	password: z.string(),
});

export const refreshSchema = z.object({
	refreshToken: z.string(),
});
