import { z } from 'zod';

export const createAnnouncementSchema = z.object({
	title: z.string().min(5).max(50),
	description: z.string().min(10),
	price: z.preprocess((val) => (typeof val === 'string' ? Number(val) : val), z.number().positive()),
	category: z.enum(['sale', 'service', 'job', 'other']),
});

export const updateAnnouncementSchema = z
	.object({
		title: z.string().min(5).max(50).optional(),
		description: z.string().min(10).optional(),
		price: z.preprocess((val) => (typeof val === 'string' ? Number(val) : val), z.number().positive().optional()),
		category: z.enum(['sale', 'service', 'job', 'other']).optional(),
	})
	.refine((data) => Object.keys(data).length > 0 || data.title !== undefined || data.description !== undefined || data.price !== undefined || data.category !== undefined, {
		message: 'At least one field must be provided for update',
	});

export const getAnnouncementsQuerySchema = z.object({
	search: z.string().optional(),
	sort: z.enum(['newest', 'oldest']).optional().default('newest'),
	page: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : 1))
		.pipe(z.number().int().positive()),
});

export const announcementIdParamSchema = z.object({
	id: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive()),
});
