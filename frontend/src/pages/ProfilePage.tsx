// Файл: frontend/src/pages/ProfilePage.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { authApi } from '../shared/api/auth';
import { updateUserProfile, updateAvatar } from '../entities/user/userSlice';

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
                alert('Avatar updated!');
            } catch (error) {
                alert('Failed to upload avatar');
            }
        }
    };

    if (!user) {
        return <div>Loading profile...</div>;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    return (
        <div>
            <h2>Profile: {user.nickname}</h2>
            <div>
                <h3>Avatar</h3>
                {user.profile?.avatarUrl ?
                    <img
                        src={`${API_BASE_URL}${user.profile.avatarUrl}`}
                        alt="avatar"
                        width="100"
                        // Добавляем квери-параметр, чтобы обойти кеширование браузера при смене аватара
                        key={Date.now()}
                    />
                    : <p>No avatar uploaded.</p>
                }
                <p>Upload new avatar:</p>
                <input type="file" onChange={handleAvatarUpload} accept="image/*" />
            </div>
            <hr/>
            <form onSubmit={handleProfileSubmit}>
                <h3>Edit Profile</h3>
                <div><input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" /></div>
                <div><input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" /></div>
                <div><input name="country" value={formData.country} onChange={handleChange} placeholder="Country" /></div>
                <div><input name="city" value={formData.city} onChange={handleChange} placeholder="City" /></div>
                <button type="submit">Save Profile</button>
            </form>
            <hr/>
            <h3>Stats</h3>
            <p>Rating: {user.profile?.rating}</p>
            <p>Wins: {user.profile?.wins}</p>
            <p>Losses: {user.profile?.losses}</p>
            <p>Draws: {user.profile?.draws}</p>
        </div>
    );
};

export default ProfilePage;