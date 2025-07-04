// Файл: backend/src/infrastructure/http/routes/game.routes.ts

import { Router } from 'express';
import { gameController } from '../controllers/game.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';

const router = Router();

router.get('/history', isAuthenticated, gameController.getHistory);
router.get('/:id', isAuthenticated, gameController.getCompletedGame); // <-- НОВЫЙ РОУТ

export { router as gameRoutes };