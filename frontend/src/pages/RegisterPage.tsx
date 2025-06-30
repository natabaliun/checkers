// Файл: frontend/src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../shared/api/auth';

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
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required /></div>
                <div><input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Nickname" required /></div>
                <div><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></div>
                <button type="submit">Register</button>
            </form>
            {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
    );
};

export default RegisterPage;