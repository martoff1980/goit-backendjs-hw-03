import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './src/routes/auth.routes';
import announcementsRoutes from './src/routes/announcements.routes';
import { getOpenApiDocumentation } from './src/openapi';
import logger from './src/logger';
import multer from 'multer';

const app = express();

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [`http://localhost:${process.env.PORT}`];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	})
);

app.use(pinoHttp({ logger }));
app.use(express.json());

// OpenAPI docs
const openApiDocument = getOpenApiDocumentation();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Routes
app.use('/auth', authRoutes);
app.use('/announcements', announcementsRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	logger.error(err);
	if (err.message === 'Not allowed by CORS') {
		return res.status(403).json({ error: 'Not allowed by CORS' });
	}
	if (err.type === 'entity.parse.failed') {
		return res.status(400).json({ error: 'Invalid JSON payload' });
	}
	if (err instanceof multer.MulterError || err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('Unexpected field')) {
		return res.status(400).json({ error: err.message || 'File upload error' });
	}
	if (err.code === 'P2025') {
		return res.status(404).json({ error: 'Record not found' });
	}
	res.status(500).json({ error: 'Internal server error' });
});

export default app;
