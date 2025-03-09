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
import { getDatabase, ref, set, get, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
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
async function signup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Clear previous error message
    signupErrorMessage.textContent = '';

    // Validate inputs
    if (!email || !password || !confirmPassword) {
        signupErrorMessage.textContent = 'Please fill in all fields';
        return;
    }

    if (password !== confirmPassword) {
        signupErrorMessage.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        signupErrorMessage.textContent = 'Password must be at least 6 characters';
        return;
    }

    // Disable signup button and show loading state
    signupButton.disabled = true;
    signupButton.textContent = 'Creating account...';

    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Initialize user data in the database
        await set(ref(database, `users/${user.uid}`), {
            email: user.email,
            username: user.email.split('@')[0],
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            photoURL: user.photoURL || '',
            stats: {
                gamesPlayed: 0,
                totalWins: 0,
                totalLosses: 0,
                totalDraws: 0,
                winRate: 0,
                lastUpdated: serverTimestamp()
            }
        });

        // Redirect to game page
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Signup error:", error);
        signupButton.disabled = false;
        signupButton.textContent = 'Sign Up';

        // Handle specific error cases
        switch (error.code) {
            case 'auth/email-already-in-use':
                signupErrorMessage.textContent = 'Email already in use';
                break;
            case 'auth/invalid-email':
                signupErrorMessage.textContent = 'Invalid email format';
                break;
            case 'auth/weak-password':
                signupErrorMessage.textContent = 'Password is too weak';
                break;
            default:
                signupErrorMessage.textContent = 'Signup failed: ' + error.message;
        }
    }
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

// Google Sign-in functionality
async function signInWithGoogle(buttonElement, errorElement, isSignup = false) {
    // Clear any existing error messages
    errorElement.textContent = '';

    // Show loading state
    const originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if this is a new user (sign up)
        if (result.additionalUserInfo.isNewUser) {
            // Initialize user data in the database
            await set(ref(database, `users/${user.uid}`), {
                email: user.email,
                username: user.email.split('@')[0],
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                photoURL: user.photoURL || '',
                stats: {
                    gamesPlayed: 0,
                    totalWins: 0,
                    totalLosses: 0,
                    totalDraws: 0,
                    winRate: 0,
                    lastUpdated: serverTimestamp()
                }
            });
        } else {
            // Update last login for existing users
            await set(ref(database, `users/${user.uid}/lastLogin`), serverTimestamp());
        }

        // Redirect to game page
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Google sign-in error:", error);
        
        // Reset button
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText;

        // Handle specific error cases
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorElement.textContent = 'Sign-in cancelled';
                break;
            case 'auth/popup-blocked':
                errorElement.textContent = 'Popup blocked by browser';
                break;
            default:
                errorElement.textContent = 'Sign-in failed: ' + error.message;
        }
    }
}

// Google login button
googleLoginButton.addEventListener('click', () => {
    signInWithGoogle(googleLoginButton, errorMessage, false);
});

// Google signup button
googleSignupButton.addEventListener('click', () => {
    signInWithGoogle(googleSignupButton, signupErrorMessage, true);
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