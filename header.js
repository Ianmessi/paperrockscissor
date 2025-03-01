// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create and insert header when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create header element
    const header = document.createElement('header');
    header.className = 'game-header';
    
    // Create header content
    header.innerHTML = `
        <div class="header-container">
            <div class="logo">
                <a href="index.html">Rock Paper Scissors</a>
            </div>
            <nav class="nav-menu">
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="reviews.html">Reviews</a></li>
                    <li id="authLinks">
                        <a href="login.html" class="login-link">Login</a>
                    </li>
                </ul>
            </nav>
            <div class="user-info" style="display: none;">
                <span class="user-email"></span>
                <button id="signOutBtn" class="sign-out-btn">Sign Out</button>
            </div>
        </div>
    `;
    
    // Insert header at the beginning of the body
    document.body.insertBefore(header, document.body.firstChild);
    
    // Get elements
    const authLinks = document.getElementById('authLinks');
    const userInfo = document.querySelector('.user-info');
    const userEmail = document.querySelector('.user-email');
    const signOutBtn = document.getElementById('signOutBtn');
    
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            authLinks.style.display = 'none';
            userInfo.style.display = 'flex';
            userEmail.textContent = user.email;
        } else {
            // User is signed out
            authLinks.style.display = 'block';
            userInfo.style.display = 'none';
        }
    });
    
    // Add sign out functionality
    signOutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            // Sign-out successful
            window.location.reload();
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });
    
    // Add header styles
    const style = document.createElement('style');
    style.textContent = `
        .game-header {
            background-color: rgba(0, 0, 0, 0.8);
            padding: 15px 0;
            border-bottom: 2px solid rgba(46, 204, 113, 0.6);
            box-shadow: 0 2px 10px rgba(46, 204, 113, 0.3);
        }
        
        .header-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
        }
        
        .logo a {
            color: #2ecc71;
            font-size: 1.5em;
            font-weight: bold;
            text-decoration: none;
            text-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
        }
        
        .nav-menu ul {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .nav-menu li {
            margin-left: 20px;
        }
        
        .nav-menu a {
            color: white;
            text-decoration: none;
            padding: 5px 10px;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        
        .nav-menu a:hover {
            background-color: rgba(46, 204, 113, 0.2);
            color: #2ecc71;
        }
        
        .login-link {
            background-color: #2ecc71;
            color: white !important;
            padding: 8px 15px !important;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        
        .login-link:hover {
            background-color: #27ae60 !important;
        }
        
        .user-info {
            display: flex;
            align-items: center;
        }
        
        .user-email {
            color: white;
            margin-right: 15px;
        }
        
        .sign-out-btn {
            background-color: transparent;
            color: #e74c3c;
            border: 1px solid #e74c3c;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .sign-out-btn:hover {
            background-color: #e74c3c;
            color: white;
        }
        
        @media (max-width: 768px) {
            .header-container {
                flex-direction: column;
                text-align: center;
            }
            
            .nav-menu {
                margin-top: 15px;
            }
            
            .nav-menu ul {
                flex-direction: column;
            }
            
            .nav-menu li {
                margin: 5px 0;
            }
            
            .user-info {
                margin-top: 15px;
                flex-direction: column;
            }
            
            .user-email {
                margin-right: 0;
                margin-bottom: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
}); 