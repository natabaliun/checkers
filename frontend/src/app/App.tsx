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
import GamePage from '../pages/GamePage';
import styles from './App.module.scss'; // Импортируем стили

function App() {
    const dispatch = useAppDispatch();
    const { isAuthenticated, user, status } = useAppSelector((state) => state.user);
    const navigate = useNavigate();

    useEffect(() => {
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
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <Link to="/" className={styles.navLink}>Home</Link>
                    <div style={{ flexGrow: 1 }}></div> {/* Распорка для расталкивания элементов */}
                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className={styles.navLink}>{user?.nickname}</Link>
                            <Link to="/game" className={styles.navLink}>Game</Link>
                            <button onClick={handleLogout} className={styles.navButton}>Logout</button>
                        </>
                    ) : (
                        status !== 'loading' && (
                            <>
                                <Link to="/login" className={styles.navLink}>Login</Link>
                                <Link to="/register" className={styles.navLink}>Register</Link>
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
                        <Route path="/game" element={<GamePage />} />
                    </Route>
                </Routes>
            </main>
        </div>
    );
}

export default App;