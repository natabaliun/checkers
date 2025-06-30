// Файл: backend/src/infrastructure/http/validators/userValidators.ts

import Joi from 'joi';

export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    nickname: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const updateUserProfileSchema = Joi.object({
    firstName: Joi.string().allow('').optional(),
    lastName: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
});