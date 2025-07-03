// Файл: frontend/src/app/App.tsx

import { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../shared/hooks/redux';
import { checkAuth, logout } from '../entities/user/userSlice';
import { ProtectedRoute } from './providers/ProtectedRoute';
import { LobbyPage } from '../pages/LobbyPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import { GamePage } from '../pages/GamePage';
import styles from './App.module.scss';
import commonStyles from '../shared/ui/Common.module.scss';
import { ReturnToGame } from '../features/auth/ReturnToGame';


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
                    <Link to="/" className={styles.logo}>Русские Шашки</Link>
                    <div className={styles.spacer}></div>
                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className={styles.navLink}>{user?.nickname}</Link>
                            <button onClick={handleLogout} className={styles.navButton}>Выйти</button>
                        </>
                    ) : (
                        status !== 'loading' && (
                            <div className={styles.authLinks}>
                                <Link to="/login" className={styles.navLink}>Войти</Link>
                                <Link to="/register" className={`${commonStyles.button} ${styles.registerBtn}`}>Регистрация</Link>
                            </div>
                        )
                    )}
                </nav>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<LobbyPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/game/:gameId" element={<GamePage />} />
                    </Route>
                </Routes>
            </main>
            <ReturnToGame />
        </div>
    );
}

export default App;