// Файл: frontend/src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../shared/hooks/redux';
import { loginSuccess } from '../entities/user/userSlice';
import { authApi } from '../shared/api/auth';

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
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required /></div>
                <div><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></div>
                <button type="submit">Login</button>
            </form>
            {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
    );
};

export default LoginPage;