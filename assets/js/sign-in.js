// ===== Form Validation =====
const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let valid = true;

    if (email === '') { alert('Please enter your email.'); valid = false; }
    else if (!validateEmail(email)) { alert('Please enter a valid email address.'); valid = false; }

    if (password === '') { alert('Please enter your password.'); valid = false; }
    else if (password.length < 6) { alert('Password must be at least 6 characters.'); valid = false; }

    if (valid) { 
        alert('Login successful! Redirecting to dashboard...'); 
        localStorage.setItem('learnx_auth', 'true');
        form.reset(); 
        window.location.href = "dashboard.html";
    }
});

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// Social Login Buttons
document.getElementById('google-login').addEventListener('click', () => { alert('Google login clicked (Demo)'); });
document.getElementById('github-login').addEventListener('click', () => { alert('GitHub login clicked (Demo)'); });
document.getElementById('linkedin-login').addEventListener('click', () => { alert('LinkedIn login clicked (Demo)'); });
