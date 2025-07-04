// Файл: backend/src/infrastructure/http/middlewares/auth.middleware.ts

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; // <-- Импорт
import { prisma } from '../../database/prisma';
import { config } from '../../../shared/config';

// JWT стратегия (без изменений)
passport.use(
    new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.jwtSecret,
    }, async (jwt_payload, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: jwt_payload.id } });
            if (user) return done(null, user);
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

// --- НОВАЯ GOOGLE СТРАТЕГИЯ ---
passport.use(
    new GoogleStrategy({
            clientID: config.google.clientID,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Ищем пользователя по googleId
                let user = await prisma.user.findUnique({
                    where: { googleId: profile.id },
                });

                if (user) {
                    return done(null, user); // Пользователь найден, возвращаем его
                }

                // Если пользователя нет, ищем по email
                user = await prisma.user.findUnique({
                    where: { email: profile.emails?.[0].value },
                });

                if (user) {
                    // Если есть юзер с таким email, но без googleId, обновляем его
                    user = await prisma.user.update({
                        where: { email: profile.emails?.[0].value },
                        data: { googleId: profile.id },
                    });
                    return done(null, user);
                }

                // Если пользователя нет совсем, создаем нового
                const newUser = await prisma.user.create({
                    data: {
                        googleId: profile.id,
                        email: profile.emails?.[0].value || '',
                        nickname: profile.displayName || profile.emails?.[0].value.split('@')[0] || `user${Date.now()}`,
                        profile: {
                            create: {
                                firstName: profile.name?.givenName,
                                lastName: profile.name?.familyName,
                                avatarUrl: profile.photos?.[0].value,
                            }
                        }
                    }
                });
                return done(null, newUser);

            } catch (error) {
                return done(error, false);
            }
        })
);


export const isAuthenticated = passport.authenticate('jwt', { session: false });