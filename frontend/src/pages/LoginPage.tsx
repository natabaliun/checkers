// Файл: frontend/src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../shared/hooks/redux';
import { loginSuccess } from '../entities/user/userSlice';
import { authApi } from '../shared/api/auth';
import styles from '../shared/ui/Form.module.scss';

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

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.title}>Login</h2>
            <div className={styles.formGroup}>
                <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
            </div>
            <div className={styles.formGroup}>
                <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.button} type="submit">Login</button>
        </form>
    );
};

export default LoginPage;