import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './shared/config/i18n/i18n'; // Путь к файлу i18n

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <Suspense fallback="loading...">
            <App />
        </Suspense>
    </React.StrictMode>
);