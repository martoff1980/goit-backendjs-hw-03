import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: number;
				username: string;
			};
		}
	}
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const token = authHeader.split(' ')[1];
	const secret = process.env.JWT_SECRET || 'secret';

	try {
		const decoded = jwt.verify(token, secret) as unknown as { id: number; username: string };
		req.user = decoded;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};
