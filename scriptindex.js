const API_URL = 'http://localhost:3000/api/auth';

// Check if user is already logged in with a valid token
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, checking authentication...');
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Validate token by making a test request to a protected endpoint
            const response = await fetch(`${API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                console.log('Valid token found, redirecting to dashboard...');
                window.location.href = '/dashboard.html';
            } else {
                console.warn('Invalid or expired token, clearing localStorage...');
                localStorage.removeItem('token');
                localStorage.removeItem('userName');
                localStorage.removeItem('currentUserEmail');
            }
        } catch (error) {
            console.error('Error validating token:', error.message);
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            localStorage.removeItem('currentUserEmail');
        }
    } else {
        console.log('No token found, staying on login page.');
    }
});

// Toggle between login and signup forms
document.getElementById('flip').addEventListener('change', () => {
    console.log('Toggling between login and signup forms');
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('signup-error').style.display = 'none';
});

async function handleLogin() {
    console.log('Attempting login...');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorElement = document.getElementById('login-error');

    errorElement.style.display = 'none';

    if (!email || !password) {
        console.warn('Login failed: Email or password missing');
        errorElement.textContent = 'Email and password are required';
        errorElement.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        console.log('Login successful, storing token and redirecting...');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('currentUserEmail', email);
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Login error:', error.message);
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    }
}

async function handleSignup() {
    console.log('Attempting signup...');
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const errorElement = document.getElementById('signup-error');

    errorElement.style.display = 'none';

    if (!name || !email || !password) {
        console.warn('Signup failed: Missing required fields');
        errorElement.textContent = 'All fields are required';
        errorElement.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        console.log('Signup successful, storing token and redirecting...');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', name);
        localStorage.setItem('currentUserEmail', email);
        alert('Signup successful! Redirecting to dashboard.');
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Signup error:', error.message);
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
    }
}