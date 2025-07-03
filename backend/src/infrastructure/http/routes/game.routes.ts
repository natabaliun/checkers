// Файл: backend/src/infrastructure/http/routes/game.routes.ts

import { Router } from 'express';
import { gameController } from '../controllers/game.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

router.get('/history', isAuthenticated, gameController.getHistory);

// В будущем здесь будет роут для анализа: GET /:id

export { router as gameRoutes };