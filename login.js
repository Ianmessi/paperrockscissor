// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const googleLoginButton = document.getElementById('googleLoginButton');
const googleSignupButton = document.getElementById('googleSignupButton');
const errorMessage = document.getElementById('errorMessage');
const signupErrorMessage = document.getElementById('signupErrorMessage');
const forgotPasswordLink = document.getElementById('forgotPassword');

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, redirect to home page
        window.location.href = 'index.html';
    }
});

// Toggle between login and signup forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    errorMessage.textContent = '';
    signupErrorMessage.textContent = '';
    document.getElementById('signupEmail').focus();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    errorMessage.textContent = '';
    signupErrorMessage.textContent = '';
    document.getElementById('email').focus();
});

// Login function
function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password';
        return;
    }
    
    // Show loading state
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in successfully
            window.location.href = 'index.html';
        })
        .catch((error) => {
            // Handle errors
            loginButton.disabled = false;
            loginButton.textContent = 'Log In';
            
            console.error("Login error:", error);
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage.textContent = 'Invalid email format';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage.textContent = 'Invalid email or password';
                    break;
                case 'auth/too-many-requests':
                    errorMessage.textContent = 'Too many failed login attempts. Please try again later';
                    break;
                default:
                    errorMessage.textContent = 'Login failed: ' + error.message;
            }
        });
}

// Login button click
loginButton.addEventListener('click', login);

// Login form enter key press
loginForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        login();
    }
});

// Signup function
function signup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const username = email.split('@')[0]; // Use part before @ as username

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Set display name
            return updateProfile(user, {
                displayName: username
            }).then(() => {
                console.log("Display name set:", username);
                
                // Initialize user stats in database
                return set(ref(database, 'users/' + user.uid), {
                    email: user.email,
                    username: username,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    stats: {
                        gamesPlayed: 0,
                        totalWins: 0,
                        totalLosses: 0,
                        totalDraws: 0,
                        winRate: 0,
                        lastUpdated: new Date().toISOString()
                    }
                });
            });
        })
        .then(() => {
            console.log("User record created in database");
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error("Error during signup:", error);
            showError(error.message);
        });
}

// Signup button click
signupButton.addEventListener('click', signup);

// Signup form enter key press
signupForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        signup();
    }
});

// Google Sign-in functionality (shared between login and signup)
function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            
            // Check if user exists in database
            return get(ref(database, 'users/' + user.uid))
                .then((snapshot) => {
                    if (!snapshot.exists()) {
                        // Create new user record with stats
                        return set(ref(database, 'users/' + user.uid), {
                            email: user.email,
                            username: user.displayName || user.email.split('@')[0],
                            photoURL: user.photoURL || null,
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString(),
                            stats: {
                                gamesPlayed: 0,
                                totalWins: 0,
                                totalLosses: 0,
                                totalDraws: 0,
                                winRate: 0,
                                lastUpdated: new Date().toISOString()
                            }
                        });
                    } else {
                        // Update last login
                        return set(ref(database, 'users/' + user.uid + '/lastLogin'), new Date().toISOString());
                    }
                });
        })
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error("Error during Google sign-in:", error);
            showError(error.message);
        });
}

// Google login button
googleLoginButton.addEventListener('click', () => {
    signInWithGoogle();
});

// Google signup button
googleSignupButton.addEventListener('click', () => {
    signInWithGoogle();
});

// Forgot password functionality
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        errorMessage.textContent = 'Please enter your email address';
        return;
    }
    
    // Show loading state
    forgotPasswordLink.textContent = 'Sending...';
    
    sendPasswordResetEmail(auth, email)
        .then(() => {
            errorMessage.textContent = '';
            alert('Password reset email sent! Check your inbox.');
            forgotPasswordLink.textContent = 'Forgot password?';
        })
        .catch((error) => {
            forgotPasswordLink.textContent = 'Forgot password?';
            
            console.error("Password reset error:", error);
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage.textContent = 'Invalid email format';
                    break;
                case 'auth/user-not-found':
                    errorMessage.textContent = 'No account found with this email';
                    break;
                default:
                    errorMessage.textContent = 'Error: ' + error.message;
            }
        });
});

// Set focus on email field when page loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('email').focus();
});