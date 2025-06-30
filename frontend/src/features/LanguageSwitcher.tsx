import { useTranslation } from 'react-i18next';
import { Button } from '../shared/ui/Button';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru');
    return <Button onClick={toggleLanguage}>{i18n.language.toUpperCase()}</Button>;
};