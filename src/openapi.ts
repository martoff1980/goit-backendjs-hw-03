import { OpenApiGeneratorV3, OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
});

const UserSchema = registry.register(
	'User',
	z.object({
		id: z.number(),
		username: z.string(),
		email: z.string(),
		name: z.string(),
	})
);

const AnnouncementSchema = registry.register(
	'Announcement',
	z.object({
		id: z.number(),
		title: z.string(),
		description: z.string(),
		price: z.number(),
		category: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
		user: UserSchema,
	})
);

// Registrations (Operations)

// Auth Routes
registry.registerPath({
	method: 'post',
	path: '/auth/register',
	tags: ['Auth'],
	summary: 'New user registration',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						username: z.string().min(3).max(30),
						email: z.string().email(),
						password: z.string().min(6),
						name: z.string().min(2),
					}),
				},
			},
		},
	},
	responses: {
		201: {
			description: 'Успішна реєстрація',
			content: {
				'application/json': {
					schema: z.object({
						user: UserSchema,
						accessToken: z.string(),
						refreshToken: z.string(),
					}),
				},
			},
		},
		409: { description: 'Username or email already taken' },
	},
});

registry.registerPath({
	method: 'post',
	path: '/auth/login',
	tags: ['Auth'],
	summary: 'User Login',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						username: z.string(),
						password: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Successful login',
			content: {
				'application/json': {
					schema: z.object({
						user: UserSchema,
						accessToken: z.string(),
						refreshToken: z.string(),
					}),
				},
			},
		},
		401: { description: 'Invalid credentials' },
	},
});

registry.registerPath({
	method: 'post',
	path: '/auth/refresh',
	tags: ['Auth'],
	summary: 'Access token refresh',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({ refreshToken: z.string() }),
				},
			},
		},
	},
	responses: {
		200: {
			description: 'New token pair',
			content: {
				'application/json': {
					schema: z.object({
						accessToken: z.string(),
						refreshToken: z.string(),
					}),
				},
			},
		},
		401: { description: 'Invalid refresh token' },
	},
});

registry.registerPath({
	method: 'post',
	path: '/auth/logout',
	tags: ['Auth'],
	security: [{ bearerAuth: [] }],
	summary: 'User logout',
	responses: {
		204: { description: 'No Content' },
		401: { description: 'Unauthorized' },
	},
});

registry.registerPath({
	method: 'get',
	path: '/auth/me',
	tags: ['Auth'],
	security: [{ bearerAuth: [] }],
	summary: 'Current user profile',
	responses: {
		200: {
			description: 'User data',
			content: {
				'application/json': {
					schema: UserSchema.extend({ createdAt: z.string() }),
				},
			},
		},
		401: { description: 'Unauthorized' },
	},
});

// Announcements Routes
registry.registerPath({
	method: 'get',
	path: '/announcements',
	tags: ['Announcements'],
	summary: 'Get a list of announcements',
	parameters: [
		{ name: 'search', in: 'query', required: false, schema: { type: 'string' } },
		{ name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: ['newest', 'oldest'] } },
		{ name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
	],
	responses: {
		200: {
			description: 'List of announcements with pagination',
			content: {
				'application/json': {
					schema: z.object({
						data: z.array(AnnouncementSchema),
						pagination: z.object({
							total: z.number(),
							page: z.number(),
							totalPages: z.number(),
							perPage: z.number(),
						}),
					}),
				},
			},
		},
	},
});

registry.registerPath({
	method: 'get',
	path: '/announcements/{id}',
	tags: ['Announcements'],
	summary: 'Get announcement ad by ID',
	parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
	responses: {
		200: {
			description: 'Listing details',
			content: {
				'application/json': { schema: AnnouncementSchema },
			},
		},
		404: { description: 'Announcement not found' },
	},
});

registry.registerPath({
	method: 'post',
	path: '/announcements',
	tags: ['Announcements'],
	security: [{ bearerAuth: [] }],
	summary: 'Create an announcement',
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						title: z.string().min(5).max(50),
						description: z.string().min(10),
						price: z.number().positive(),
						category: z.enum(['sale', 'service', 'job', 'other']),
					}),
				},
			},
		},
	},
	responses: {
		201: {
			description: 'The announcement has been created.',
			content: {
				'application/json': { schema: AnnouncementSchema },
			},
		},
		401: { description: 'Unauthorized' },
	},
});

registry.registerPath({
	method: 'patch',
	path: '/announcements/{id}',
	tags: ['Announcements'],
	security: [{ bearerAuth: [] }],
	summary: 'Update an announcement',
	parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
	request: {
		body: {
			content: {
				'application/json': {
					schema: z.object({
						title: z.string().min(5).max(50).optional(),
						description: z.string().min(10).optional(),
						price: z.number().positive().optional(),
						category: z.enum(['sale', 'service', 'job', 'other']).optional(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Updated announcement',
			content: {
				'application/json': { schema: AnnouncementSchema },
			},
		},
		403: { description: 'Access denied' },
		404: { description: 'Announcement not found' },
	},
});

registry.registerPath({
	method: 'delete',
	path: '/announcements/{id}',
	tags: ['Announcements'],
	security: [{ bearerAuth: [] }],
	summary: 'Delete an announcement',
	parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
	responses: {
		204: { description: 'No Content' },
		403: { description: 'Access denied' },
		404: { description: 'Announcement not found' },
	},
});

export function getOpenApiDocumentation() {
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: '3.0.0',
		info: {
			title: 'Announcements Board API',
			version: '1.0.0',
			description: 'REST API for announcements board with JWT authentication and Prisma',
		},
		servers: [{ url: 'http://localhost:3000' }],
	});
}
