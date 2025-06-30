// Файл: frontend/src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import './shared/config/i18n/i18n';
import './app/styles/index.scss';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <Suspense fallback="loading...">
                    <App />
                </Suspense>
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);