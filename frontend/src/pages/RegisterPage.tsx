// Файл: frontend/src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../shared/api/auth';
import styles from '../shared/ui/Form.module.scss'; // Используем общие стили для форм

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
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.title}>Register</h2>
            <div className={styles.formGroup}>
                <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
            </div>
            <div className={styles.formGroup}>
                <input className={styles.input} type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Nickname" required />
            </div>
            <div className={styles.formGroup}>
                <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.button} type="submit">Register</button>
        </form>
    );
};

export default RegisterPage;