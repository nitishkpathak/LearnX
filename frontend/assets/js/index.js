// -------------------- Search Box Validation --------------------
// Moved to theme.js to handle globally across all pages

// -------------------- Email Subscription Form --------------------
const subscribeForm = document.querySelector(".latter form");
if (subscribeForm) {
    subscribeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = subscribeForm.querySelector("input[type='email']").value.trim();
        if (email === "") {
            Swal.fire({
                icon: 'warning',
                title: 'Oops...',
                text: 'Please enter your email!',
                confirmButtonColor: '#6366f1'
            });
        } else if (!email.includes("@")) {
            Swal.fire({
                icon: 'warning',
                title: 'Oops...',
                text: 'Enter a valid email address!',
                confirmButtonColor: '#6366f1'
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Subscribed!',
                text: "Subscribed successfully with: " + email,
                confirmButtonColor: '#6366f1'
            });
            // Future: yahan backend POST /subscribe call
            subscribeForm.reset();
        }
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const subscribeBtn = document.getElementById("subscribeBtn");

    if (subscribeBtn) {
        subscribeBtn.addEventListener("click", function (e) {
            e.preventDefault(); // page reload nahi hoga

            // Alert message
            Swal.fire({
                icon: 'success',
                title: 'Subscribed! 🎉',
                text: 'Thank you for subscribing to LearnX! Your $14.99/month subscription is active.',
                confirmButtonColor: '#6366f1'
            });

            // Optional: Button disable & change text
            subscribeBtn.textContent = "Subscribed ✅";
            subscribeBtn.classList.remove("btn-success");
            subscribeBtn.classList.add("btn-secondary");
            subscribeBtn.disabled = true;
        });
    }
});


// पहले ये confirm करो कि browser से call जा रहा है
function testSignup() {
    fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: "TestUser",
            email: "testuser@gmail.com",
            password: "123456"
        })
    })
        .then(res => res.json())
        .then(data => console.log(data));
}

// ================== ✅ REMOVED SW FOR DEV ==================

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
            console.log("✅ Service Worker Unregistered to prevent caching issues");
        }
    });
}