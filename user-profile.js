import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import userFirebaseConfig from './firebase-users-config.js';

// Initialize the second Firebase app for user profiles
const userApp = initializeApp(userFirebaseConfig, 'userProfilesApp');
const userDb = getDatabase(userApp);

// Function to save user profile
export async function saveUserProfile(userId, email) {
    try {
        const defaultUsername = email.split('@')[0];
        const existingProfile = await getUserProfile(userId);
        
        const profile = {
            email: email,
            username: existingProfile?.username || defaultUsername,
            lastUpdated: Date.now(),
            joinedDate: existingProfile?.joinedDate || Date.now(),
            customAvatar: existingProfile?.customAvatar || null,
            status: existingProfile?.status || 'online',
            title: existingProfile?.title || 'Rookie',
            achievements: existingProfile?.achievements || []
        };

        await set(ref(userDb, `users/${userId}`), profile);
        console.log('Profile saved successfully:', profile);
        return true;
    } catch (error) {
        console.error('Error saving user profile:', error);
        return false;
    }
}

// Function to update specific profile fields
export async function updateUserProfile(userId, updates) {
    try {
        const userRef = ref(userDb, `users/${userId}`);
        await update(userRef, {
            ...updates,
            lastUpdated: Date.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
}

// Function to get user profile
export async function getUserProfile(userId) {
    try {
        const snapshot = await get(ref(userDb, `users/${userId}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

// Function to get all user profiles
export async function getAllUserProfiles() {
    try {
        const snapshot = await get(ref(userDb, 'users'));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return {};
    } catch (error) {
        console.error('Error getting all user profiles:', error);
        return {};
    }
}

// Function to update user status
export async function updateUserStatus(userId, status) {
    return updateUserProfile(userId, { status });
}

// Function to award achievement
export async function awardAchievement(userId, achievement) {
    try {
        const profile = await getUserProfile(userId);
        if (!profile) return false;

        const achievements = profile.achievements || [];
        if (!achievements.includes(achievement)) {
            achievements.push(achievement);
            return await updateUserProfile(userId, { achievements });
        }
        return true;
    } catch (error) {
        console.error('Error awarding achievement:', error);
        return false;
    }
}

// Function to update user title
export async function updateUserTitle(userId, title) {
    return updateUserProfile(userId, { title });
}

// Constants for achievements and titles
export const ACHIEVEMENTS = {
    FIRST_WIN: 'First Victory',
    WINNING_STREAK_3: 'Hat Trick',
    WINNING_STREAK_5: 'Unstoppable',
    GAMES_PLAYED_10: 'Dedicated Player',
    GAMES_PLAYED_50: 'Veteran',
    WINS_20: 'Master',
    WINS_50: 'Grand Master',
    WIN_RATE_70: 'Elite Player'
};

export const TITLES = {
    ROOKIE: 'Rookie',
    AMATEUR: 'Amateur',
    INTERMEDIATE: 'Intermediate',
    EXPERT: 'Expert',
    MASTER: 'Master',
    LEGEND: 'Legend'
}; 