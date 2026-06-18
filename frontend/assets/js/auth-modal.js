// Globally accessible navbar state updater
function updateNavbarAuthState() {
    const isLoggedIn = localStorage.getItem('learnx_auth') === 'true';
    const navbarIcons = document.querySelectorAll('.navbar-icons');

    navbarIcons.forEach(container => {
        const loginBtn = container.querySelector('[data-bs-target="#loginModal"]');
        const signupBtn = container.querySelector('[data-bs-target="#signupModal"]');

        // Clean up any existing dashboard button
        const oldDashBtn = container.querySelector('.btn-dashboard');
        if (oldDashBtn) oldDashBtn.remove();

        if (isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';

            const dashboardBtn = document.createElement('a');
            dashboardBtn.href = '#';
            dashboardBtn.className = 'btn btn-outline-light btn-sm ms-3 btn-dashboard';
            dashboardBtn.innerHTML = '<i class="fas fa-columns"></i> Dashboard';
            dashboardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('dashboard');
            });
            container.appendChild(dashboardBtn);
        } else {
            if (loginBtn) loginBtn.style.display = '';
            if (signupBtn) signupBtn.style.display = '';
        }
    });
}

// Make it global
window.updateNavbarAuthState = updateNavbarAuthState;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navbar state
    updateNavbarAuthState();

    // Check URL params to open modals
    const urlParams = new URLSearchParams(window.location.search);
    const showParam = urlParams.get('show');
    if (showParam === 'signup') {
        setTimeout(() => {
            const signupModalEl = document.getElementById('signupModal');
            if (signupModalEl) {
                const signupModal = bootstrap.Modal.getOrCreateInstance(signupModalEl);
                signupModal.show();
            }
        }, 300);
    } else if (showParam === 'login') {
        setTimeout(() => {
            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) {
                const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
                loginModal.show();
            }
        }, 300);
    }

    // ================================
    // LOGIN
    // ================================

    const loginForm = document.getElementById('modalLoginForm');

    if (loginForm) {

        loginForm.addEventListener('submit', async function (e) {

            e.preventDefault();

            const email = document.getElementById('modalLoginEmail').value.trim();

            const password = document.getElementById('modalLoginPassword').value.trim();

            if (!email || !password) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please fill all fields',
                    confirmButtonColor: '#6366f1'
                });
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Login Successful! ✅',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    localStorage.setItem("learnx_auth", "true");
                    localStorage.setItem("learnx_user", JSON.stringify(data.user));
                    localStorage.setItem("learnx_token", data.token);
                    loginForm.reset();

                    // Hide login modal
                    const loginModalEl = document.getElementById('loginModal');
                    if (loginModalEl) {
                        const loginModal = bootstrap.Modal.getInstance(loginModalEl);
                        if (loginModal) loginModal.hide();
                    }

                    // Update state & switch view
                    updateNavbarAuthState();
                    switchView('dashboard');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: data.message || "Invalid email or password",
                        confirmButtonColor: '#ef4444'
                    });
                }
            } catch (error) {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'Unable to connect to server. Please make sure the server is running.',
                    confirmButtonColor: '#ef4444'
                });
            }

        });

    }

    // ================================
    // SIGNUP
    // ================================

    const signupForm = document.getElementById("modalSignupForm");

    if (signupForm) {

        signupForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const fullName = document.getElementById("modalSignupName").value.trim();

            const email = document.getElementById("modalSignupEmail").value.trim();

            const phone = document.getElementById("modalSignupPhone").value.trim();

            const password = document.getElementById("modalSignupPassword").value.trim();

            const education = document.getElementById("modalSignupEdu").value;

            const category = document.getElementById("modalSignupCourse").value;

            const termsChecked = document.getElementById("modalSignupTerms").checked;

            // Validation
            if (!fullName || !email || !phone || !password || !education || !category) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please fill all fields',
                    confirmButtonColor: '#6366f1'
                });
                return;
            }

            if (!termsChecked) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please accept Terms & Conditions',
                    confirmButtonColor: '#6366f1'
                });
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: fullName,
                        email,
                        phone,
                        password,
                        education,
                        category
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Signup Successful! ✅',
                        text: 'Redirecting you to login...',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    localStorage.setItem("learnx_user", JSON.stringify({
                        name: fullName,
                        email: email
                    }));

                    signupForm.reset();

                    // close signup modal
                    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                    if (signupModal) signupModal.hide();

                    // open login modal
                    setTimeout(() => {
                        const loginEmailInput = document.getElementById('modalLoginEmail');
                        if (loginEmailInput) {
                            loginEmailInput.value = email;
                        }

                        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                        loginModal.show();
                    }, 300);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Signup Failed',
                        text: data.message || "Registration failed.",
                        confirmButtonColor: '#ef4444'
                    });
                }
            } catch (error) {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'Unable to connect to server. Please try again.',
                    confirmButtonColor: '#ef4444'
                });
            }

        });

    }

    // ================================
    // FORGOT PASSWORD
    // ================================

    const forgotForm = document.getElementById('modalForgotForm');
    const resetViaEmail = document.getElementById('resetViaEmail');
    const resetViaPhone = document.getElementById('resetViaPhone');
    const forgotEmailContainer = document.getElementById('forgotEmailContainer');
    const forgotPhoneContainer = document.getElementById('forgotPhoneContainer');

    if (resetViaEmail && resetViaPhone) {
        resetViaEmail.addEventListener('change', () => {
            forgotEmailContainer.style.display = 'block';
            forgotPhoneContainer.style.display = 'none';
        });

        resetViaPhone.addEventListener('change', () => {
            forgotEmailContainer.style.display = 'none';
            forgotPhoneContainer.style.display = 'block';
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let contactMethod = '';
            let contactValue = '';

            if (resetViaEmail && resetViaEmail.checked) {
                contactMethod = 'email';
                contactValue = document.getElementById('modalForgotEmail').value.trim();
            } else if (resetViaPhone && resetViaPhone.checked) {
                contactMethod = 'phone';
                contactValue = document.getElementById('modalForgotPhone').value.trim();
            }

            if (!contactValue) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: `Please enter your ${contactMethod}`,
                    background: '#1e293b',
                    color: '#fff'
                });
                return;
            }

            try {
                // Future: real API call here
                // For now, mock a successful response
                const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [contactMethod]: contactValue })
                }).catch(() => ({ ok: true })); // fallback if server not running

                if (response.ok || response.ok === undefined) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Link Sent!',
                        text: `A reset link has been sent to your ${contactMethod}`,
                        background: '#1e293b',
                        color: '#fff',
                        confirmButtonColor: '#00b894'
                    }).then(() => {
                        forgotForm.reset();
                        const forgotModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                        if (forgotModal) forgotModal.hide();
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Something went wrong. Please try again.',
                    background: '#1e293b',
                    color: '#fff'
                });
            }
        });
    }

    // Modal Switching Logic
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    const switchToForgot = document.getElementById('switchToForgot');
    const switchToLoginFromForgot = document.getElementById('switchToLoginFromForgot');

    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();
            setTimeout(() => {
                const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
                signupModal.show();
            }, 300);
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
            if (signupModal) signupModal.hide();
            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 300);
        });
    }

    if (switchToForgot) {
        switchToForgot.addEventListener('click', (e) => {
            e.preventDefault();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();
            setTimeout(() => {
                const forgotModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
                forgotModal.show();
            }, 300);
        });
    }

    if (switchToLoginFromForgot) {
        switchToLoginFromForgot.addEventListener('click', (e) => {
            e.preventDefault();
            const forgotModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            if (forgotModal) forgotModal.hide();
            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 300);
        });
    }
});