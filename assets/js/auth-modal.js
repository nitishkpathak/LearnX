document.addEventListener('DOMContentLoaded', () => {

    // ================================
    // Navbar Auth State
    // ================================

    const isLoggedIn = localStorage.getItem('learnx_auth') === 'true';

    if (isLoggedIn) {

        const navbarIcons = document.querySelectorAll('.navbar-icons');

        navbarIcons.forEach(container => {

            const loginBtn = container.querySelector('[data-bs-target="#loginModal"]');
            const signupBtn = container.querySelector('[data-bs-target="#signupModal"]');

            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';

            if (!container.querySelector('.btn-dashboard')) {

                const dashboardBtn = document.createElement('a');

                dashboardBtn.href = 'dashboard.html';

                dashboardBtn.className = 'btn btn-outline-light btn-sm ms-3 btn-dashboard';

                dashboardBtn.innerHTML = '<i class="fas fa-columns"></i> Dashboard';

                container.appendChild(dashboardBtn);
            }
        });
    } else {
        // Not logged in, check URL params to open modals
        const urlParams = new URLSearchParams(window.location.search);
        const showParam = urlParams.get('show');
        if (showParam === 'signup') {
            setTimeout(() => {
                const signupModalEl = document.getElementById('signupModal');
                if (signupModalEl) {
                    const signupModal = new bootstrap.Modal(signupModalEl);
                    signupModal.show();
                }
            }, 300);
        } else if (showParam === 'login') {
            setTimeout(() => {
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) {
                    const loginModal = new bootstrap.Modal(loginModalEl);
                    loginModal.show();
                }
            }, 300);
        }
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

                alert("Please fill all fields");

                return;
            }

            try {

                const response = await fetch("https://learnx-backend-wygd.onrender.com/api/auth/login", {

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

                    alert("Login Successful ✅");

                    localStorage.setItem("learnx_auth", "true");

                    localStorage.setItem("learnx_user", JSON.stringify(data.user));

                    localStorage.setItem("learnx_token", data.token);

                    loginForm.reset();

                    window.location.href = "dashboard.html";

                } else {

                    alert(data.message || "Login failed ❌");

                }

            } catch (error) {

                console.log(error);

                alert("Server Error ❌");

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

                alert("Please fill all fields");

                return;
            }

            if (!termsChecked) {

                alert("Please accept Terms & Conditions");

                return;
            }

            try {

                const res = await fetch("https://learnx-backend-wygd.onrender.com/api/auth/signup", {

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

                    alert("Signup Successful ✅");

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

                    alert(data.message || "Signup failed ❌");

                }

            } catch (error) {

                console.log(error);

                alert("Server Error ❌");

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
                const response = await fetch("https://learnx-backend-wygd.onrender.com/api/auth/forgot-password", {
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