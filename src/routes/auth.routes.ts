import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10,
	message: 'Too many requests, please try again later',
	headers: true,
});

router.use(authLimiter);

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
