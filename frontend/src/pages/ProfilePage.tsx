// Файл: frontend/src/pages/ProfilePage.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { authApi } from '../shared/api/auth';
import { updateUserProfile, updateAvatar } from '../entities/user/userSlice';
import commonStyles from '../shared/ui/Common.module.scss';
import pageStyles from './ProfilePage.module.scss';
import DefaultAvatar from '../shared/assets/default_avatar.svg'; // <-- ИМПОРТИРУЕМ SVG

const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.user);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        country: '',
        city: '',
    });

    useEffect(() => {
        if (user?.profile) {
            setFormData({
                firstName: user.profile.firstName || '',
                lastName: user.profile.lastName || '',
                country: user.profile.country || '',
                city: user.profile.city || '',
            });
        }
    }, [user]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await authApi.updateProfile(formData);
            dispatch(updateUserProfile(response.data));
            alert('Профиль обновлен!');
        } catch (error) {
            alert('Не удалось обновить профиль');
        }
    };

    const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const avatarFile = e.target.files[0];
            const uploadData = new FormData();
            uploadData.append('avatar', avatarFile);

            try {
                const response = await authApi.uploadAvatar(uploadData);
                dispatch(updateAvatar(response.data.avatarUrl));
            } catch (error) {
                alert('Не удалось загрузить аватар');
            }
        }
    };

    if (!user) {
        return <div>Загрузка профиля...</div>;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    // --- НОВАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ URL АВАТАРА ---
    const avatarSrc = user.profile?.avatarUrl
        ? `${API_BASE_URL}${user.profile.avatarUrl}`
        : DefaultAvatar;

    return (
        <div className={pageStyles.profilePage}>
            <aside className={pageStyles.sidebar}>
                <div className={pageStyles.avatarSection}>
                    <h3>{user.nickname}</h3>
                    <img
                        src={avatarSrc}
                        alt="avatar"
                        key={user.profile?.avatarUrl} // Ключ для принудительного ререндера
                    />
                    <label htmlFor="avatar-upload" className={commonStyles.button}>
                        Сменить аватар
                    </label>
                    <input id="avatar-upload" type="file" onChange={handleAvatarUpload} accept="image/*" />
                </div>
                <div className={pageStyles.statsSection}>
                    <h3>Статистика</h3>
                    <p><span>Рейтинг:</span> <span>{user.profile?.rating}</span></p>
                    <p><span>Побед:</span> <span>{user.profile?.wins}</span></p>
                    <p><span>Поражений:</span> <span>{user.profile?.losses}</span></p>
                    <p><span>Ничьих:</span> <span>{user.profile?.draws}</span></p>
                </div>
            </aside>
            <div className={`${commonStyles.card} ${pageStyles.mainContent}`}>
                <form className={commonStyles.form} onSubmit={handleProfileSubmit}>
                    <h2 className={commonStyles.title}>Редактировать профиль</h2>
                    <div className={commonStyles.formGroup}>
                        <label>Имя</label>
                        <input className={commonStyles.input} name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Ваше имя" />
                    </div>
                    <div className={commonStyles.formGroup}>
                        <label>Фамилия</label>
                        <input className={commonStyles.input} name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Ваша фамилия" />
                    </div>
                    <div className={commonStyles.formGroup}>
                        <label>Страна</label>
                        <input className={commonStyles.input} name="country" value={formData.country} onChange={handleChange} placeholder="Ваша страна" />
                    </div>
                    <div className={commonStyles.formGroup}>
                        <label>Город</label>
                        <input className={commonStyles.input} name="city" value={formData.city} onChange={handleChange} placeholder="Ваш город" />
                    </div>
                    <button className={commonStyles.button} type="submit">Сохранить</button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;