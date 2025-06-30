// Файл: frontend/src/pages/ProfilePage.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { authApi } from '../shared/api/auth';
import { updateUserProfile, updateAvatar } from '../entities/user/userSlice';
import formStyles from '../shared/ui/Form.module.scss';
import pageStyles from './ProfilePage.module.scss';

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
            alert('Profile updated!');
        } catch (error) {
            alert('Failed to update profile');
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
                alert('Failed to upload avatar');
            }
        }
    };

    if (!user) {
        return <div>Loading profile...</div>;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const defaultAvatar = 'https://via.placeholder.com/150'; // Заглушка для аватара

    return (
        <div className={pageStyles.profilePage}>
            <aside className={pageStyles.sidebar}>
                <div className={pageStyles.avatarSection}>
                    <h3>{user.nickname}</h3>
                    <img
                        src={user.profile?.avatarUrl ? `${API_BASE_URL}${user.profile.avatarUrl}` : defaultAvatar}
                        alt="avatar"
                        // Ключ для принудительного ререндера при смене URL
                        key={user.profile?.avatarUrl}
                    />
                    <label htmlFor="avatar-upload" className={pageStyles.fileInputLabel}>
                        Change Avatar
                    </label>
                    <input id="avatar-upload" type="file" onChange={handleAvatarUpload} accept="image/*" />
                </div>
                <div className={pageStyles.statsSection}>
                    <h3>Stats</h3>
                    <p><span>Rating:</span> <span>{user.profile?.rating}</span></p>
                    <p><span>Wins:</span> <span>{user.profile?.wins}</span></p>
                    <p><span>Losses:</span> <span>{user.profile?.losses}</span></p>
                    <p><span>Draws:</span> <span>{user.profile?.draws}</span></p>
                </div>
            </aside>
            <div className={pageStyles.mainContent}>
                <form className={formStyles.form} onSubmit={handleProfileSubmit} style={{maxWidth: '100%', margin: 0, boxShadow: 'none', padding: 0}}>
                    <h2 className={formStyles.title}>Edit Profile</h2>
                    <div className={formStyles.formGroup}>
                        <label>First Name</label>
                        <input className={formStyles.input} name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
                    </div>
                    <div className={formStyles.formGroup}>
                        <label>Last Name</label>
                        <input className={formStyles.input} name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
                    </div>
                    <div className={formStyles.formGroup}>
                        <label>Country</label>
                        <input className={formStyles.input} name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
                    </div>
                    <div className={formStyles.formGroup}>
                        <label>City</label>
                        <input className={formStyles.input} name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                    </div>
                    <button className={formStyles.button} type="submit">Save Profile</button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;