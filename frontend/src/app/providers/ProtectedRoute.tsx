// Файл: frontend/src/app/providers/ProtectedRoute.tsx

import { useAppSelector } from '../../shared/hooks/redux';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    const { isAuthenticated, status } = useAppSelector((state) => state.user);

    // Если проверка аутентификации еще идет, показываем заглушку.
    if (status === 'loading') {
        return <div>Checking authentication...</div>;
    }

    // Если проверка завершилась (status НЕ 'loading') и пользователь не аутентифицирован,
    // перенаправляем на страницу входа.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Если все проверки пройдены и пользователь аутентифицирован,
    // показываем защищенный контент.
    return <Outlet />;
};