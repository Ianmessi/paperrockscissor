// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        window.location.href = 'index.html';
    }
});

function showTab(tabName) {
    document.getElementById('loginForm').style.display = tabName === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tabName === 'register' ? 'block' : 'none';
    
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // Redirect is handled by the auth state observer
    } catch (error) {
        showError(error.message);
    }
}

async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;

    try {
        // Create user
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Add username to user profile
        await userCredential.user.updateProfile({
            displayName: username
        });

        // Create user data in database
        await firebase.database().ref('users/' + userCredential.user.uid).set({
            username: username,
            email: email,
            stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0
            }
        });

        // Redirect is handled by the auth state observer
    } catch (error) {
        showError(error.message);
    }
}

async function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        
        // Check if this is a new user
        const isNewUser = result.additionalUserInfo.isNewUser;
        if (isNewUser) {
            // Create user data in database
            await firebase.database().ref('users/' + result.user.uid).set({
                username: result.user.displayName,
                email: result.user.email,
                stats: {
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0
                }
            });
        }
    } catch (error) {
        showError(error.message);
    }
} 