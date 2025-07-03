// Файл: frontend/src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../shared/api/auth';
import commonStyles from '../shared/ui/Common.module.scss';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await authApi.register({ email, nickname, password });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <form className={commonStyles.form} onSubmit={handleSubmit}>
            <h2 className={commonStyles.title}>Регистрация</h2>
            <div className={commonStyles.formGroup}>
                <label htmlFor="email">Email</label>
                <input id="email" className={commonStyles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className={commonStyles.formGroup}>
                <label htmlFor="nickname">Никнейм</label>
                <input id="nickname" className={commonStyles.input} type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Your Nickname" required />
            </div>
            <div className={commonStyles.formGroup}>
                <label htmlFor="password">Пароль</label>
                <input id="password" className={commonStyles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="•••••••• (минимум 6 символов)" required />
            </div>
            {error && <p className={commonStyles.error}>{error}</p>}
            <button className={commonStyles.button} type="submit">Зарегистрироваться</button>
        </form>
    );
};

export default RegisterPage;