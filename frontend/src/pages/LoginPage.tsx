// Файл: frontend/src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../shared/hooks/redux';
import { loginSuccess } from '../entities/user/userSlice';
import { authApi } from '../shared/api/auth';
import commonStyles from '../shared/ui/Common.module.scss';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await authApi.login({ email, password });
            dispatch(loginSuccess(response.data));
            navigate('/profile');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleLogin = () => {
        // Просто переходим по ссылке на бэкенд, который инициирует процесс OAuth
        window.location.href = 'http://localhost:3001/api/auth/google';
    };


    return (
        <form className={commonStyles.form} onSubmit={handleSubmit}>
            <h2 className={commonStyles.title}>Вход</h2>
            <button
                type="button"
                onClick={handleGoogleLogin}
                className={`${commonStyles.button} ${commonStyles.buttonSecondary}`}
                style={{marginBottom: '1rem'}}
            >
                Войти через Google
            </button>
            <p style={{textAlign: 'center', margin: '-1rem 0 1rem 0', color: '#757575'}}>или</p>

            <div className={commonStyles.formGroup}>
                <label htmlFor="email">Email</label>
                <input id="email" className={commonStyles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className={commonStyles.formGroup}>
                <label htmlFor="password">Пароль</label>
                <input id="password" className={commonStyles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className={commonStyles.error}>{error}</p>}
            <button className={commonStyles.button} type="submit">Войти</button>
        </form>
    );
};

export default LoginPage;