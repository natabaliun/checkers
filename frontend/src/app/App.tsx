// Файл: frontend/src/app/App.tsx

import { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../shared/hooks/redux';
import { checkAuth, logout } from '../entities/user/userSlice';
import { ProtectedRoute } from './providers/ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';

function App() {
    const dispatch = useAppDispatch();
    const { isAuthenticated, user, status } = useAppSelector((state) => state.user);
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем аутентификацию только один раз при загрузке
        if (localStorage.getItem('token')) {
            dispatch(checkAuth());
        }
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="App">
            <header>
                <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem' }}>
                    <Link to="/">Home</Link> |{' '}
                    {isAuthenticated ? (
                        <>
                            <Link to="/profile">{user?.nickname}</Link> |{' '}
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        // Не показываем ссылки, пока идет проверка
                        status !== 'loading' && (
                            <>
                                <Link to="/login">Login</Link> |{' '}
                                <Link to="/register">Register</Link>
                            </>
                        )
                    )}
                </nav>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                </Routes>
            </main>
        </div>
    );
}

export default App;