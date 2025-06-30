// Файл: backend/src/infrastructure/http/middlewares/auth.middleware.ts

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { prisma } from '../../database/prisma';
import { config } from '../../../shared/config';

const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret,
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            // Ищем пользователя по id из токена
            const user = await prisma.user.findUnique({
                where: { id: jwt_payload.id },
                include: { profile: true },
            });
            if (user) {
                // Если пользователь найден, передаем его дальше
                return done(null, user);
            }
            // Если не найден
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export const isAuthenticated = passport.authenticate('jwt', { session: false });