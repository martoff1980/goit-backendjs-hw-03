import 'dotenv/config';

if (!process.env.JWT_SECRET) {
	console.error('ERROR: JWT_SECRET is missing in environment variables.');
	process.exit(1);
}

import app from '../app';
import logger from './logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	logger.info(`Server is running on http://localhost:${PORT}`);
	logger.info(`OpenAPI documentation available at http://localhost:${PORT}/api-docs`);
});
