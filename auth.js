// Initialize Firebase Auth
const auth = firebase.auth();

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

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;

    try {
        if (rememberMe) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'index.html'; // Redirect to home page after successful login
    } catch (error) {
        showError(error.message);
    }
});

// Register Form Submit
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        window.location.href = 'index.html'; // Redirect to home page after successful registration
    } catch (error) {
        showError(error.message);
    }
});

// Google Sign In
googleLoginBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        window.location.href = 'index.html'; // Redirect to home page after successful Google sign-in
    } catch (error) {
        showError(error.message);
    }
});

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
        // If user is signed in and on login page, redirect to home
        window.location.href = 'index.html';
    }
}); 