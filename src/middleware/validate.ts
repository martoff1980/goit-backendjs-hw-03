import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validateBody = (schema: z.ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({ error: result.error.errors });
		}
		req.body = result.data;
		next();
	};
};

export const validateQuery = (schema: z.ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.query);
		if (!result.success) {
			return res.status(400).json({ error: result.error.errors });
		}
		req.query = result.data;
		next();
	};
};

export const validateParams = (schema: z.ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.params);
		if (!result.success) {
			return res.status(400).json({ error: result.error.errors });
		}
		req.params = result.data;
		next();
	};
};
