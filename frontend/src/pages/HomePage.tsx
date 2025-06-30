// Файл: frontend/src/pages/HomePage.tsx

import { useTranslation } from 'react-i18next';
// import { LanguageSwitcher } from '../features/LanguageSwitcher'; // Раскомментируйте, если есть

const HomePage = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h1>{t('welcome')}</h1>
            {/* <LanguageSwitcher /> */}
        </div>
    );
};

export default HomePage;