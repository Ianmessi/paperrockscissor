// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const googleLoginBtn = document.getElementById('googleLogin');
const forgotPasswordLink = document.getElementById('forgotPassword');

// Show/Hide Forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    errorMessage.style.display = 'none';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    errorMessage.style.display = 'none';
});

// Function to create user data in Realtime Database
async function createUserData(user) {
  try {
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      email: user.email,
      totalGamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      winRate: 0,
      createdAt: Date.now()
    });
    console.log('User data created successfully');
  } catch (error) {
    console.error('Error creating user data:', error);
  }
}

// Function to delete user data from Realtime Database
async function deleteUserData(uid) {
  try {
    const userRef = ref(database, `users/${uid}`);
    await remove(userRef);
    console.log('User data deleted successfully');
  } catch (error) {
    console.error('Error deleting user data:', error);
  }
}

// Sign up function
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserData(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing up:', error);
    return { success: false, error: error.message };
  }
}

// Sign in function
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: error.message };
  }
}

// Sign out function
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message };
  }
}

// Listen for auth state changes
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
        } else {
            // User is signed out
            console.log('User is signed out');
        }
    });
});

// Function to delete user account
export async function deleteUserAccount() {
  try {
    const user = auth.currentUser;
    if (user) {
      // First delete user data from Realtime Database
      await deleteUserData(user.uid);
      // Then delete the user account
      await user.delete();
      return { success: true };
    }
    return { success: false, error: 'No user logged in' };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message };
  }
}

// Login function
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Successful login
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
}

// Google Sign In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const errorMessage = document.getElementById('error-message');

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Check if user exists in database
            return firebase.database().ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        // Create new user record
                        return firebase.database().ref('users/' + user.uid).set({
                            username: user.displayName,
                            email: user.email,
                            stats: {
                                gamesPlayed: 0,
                                totalWins: 0,
                                totalLosses: 0,
                                totalDraws: 0,
                                winRate: 0,
                                lastUpdated: firebase.database.ServerValue.TIMESTAMP
                            }
                        });
                    }
                });
        })
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
}

// Toggle between login and signup forms
function showSignupForm() {
    document.querySelector('.login-box').style.display = 'none';
    document.querySelector('.signup-box').style.display = 'block';
}

function showLoginForm() {
    document.querySelector('.signup-box').style.display = 'none';
    document.querySelector('.login-box').style.display = 'block';
}

// Forgot Password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;

    if (!email) {
        showError('Please enter your email address');
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showError('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
        showError(error.message);
    }
});

// Show Error Message
function showError(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    if (type === 'success') {
        errorMessage.style.background = 'rgba(46, 204, 113, 0.2)';
        errorMessage.style.border = '1px solid rgba(46, 204, 113, 0.5)';
    } else {
        errorMessage.style.background = 'rgba(231, 76, 60, 0.2)';
        errorMessage.style.border = '1px solid rgba(231, 76, 60, 0.5)';
    }

    // Hide error message after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Check Authentication State
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }
}); 