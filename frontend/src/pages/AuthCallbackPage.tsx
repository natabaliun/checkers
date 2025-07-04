// Файл: frontend/src/pages/AuthCallbackPage.tsx

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../shared/hooks/redux';
import { checkAuth } from '../entities/user/userSlice';

const AuthCallbackPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Ищем токен в параметрах URL
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (token) {
            // Сохраняем токен в localStorage
            localStorage.setItem('token', token);
            // Диспатчим checkAuth, чтобы загрузить данные пользователя по новому токену
            dispatch(checkAuth()).then(() => {
                // После успешной загрузки пользователя перенаправляем в профиль
                navigate('/profile');
            });
        } else {
            // Если токена нет, что-то пошло не так, возвращаемся на страницу входа
            navigate('/login?error=token_missing');
        }
    }, [location, navigate, dispatch]);

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>Аутентификация...</h2>
            <p>Пожалуйста, подождите, мы входим в ваш аккаунт.</p>
        </div>
    );
};

export default AuthCallbackPage;