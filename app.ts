import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './src/routes/auth.routes';
import announcementsRoutes from './src/routes/announcements.routes';
import { getOpenApiDocumentation } from './src/openapi';

const app = express();

app.use(cors());
app.use(express.json());

// OpenAPI docs
const openApiDocument = getOpenApiDocumentation();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Routes
app.use('/auth', authRoutes);
app.use('/announcements', announcementsRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err);
	if (err.code === 'P2025') {
		return res.status(404).json({ error: 'Record not found' });
	}
	res.status(500).json({ error: 'Internal server error' });
});

export default app;
