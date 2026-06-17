const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://learnx-backend-wygd.onrender.com';

// -------------------- Search Box Validation --------------------
// Moved to theme.js to handle globally across all pages

// -------------------- Email Subscription Form --------------------
const subscribeForm = document.querySelector(".latter form");
subscribeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = subscribeForm.querySelector("input[type='email']").value.trim();
    if (email === "") {
        alert("Please enter your email!");
    } else if (!email.includes("@")) {
        alert("Enter a valid email address!");
    } else {
        alert("Subscribed successfully with: " + email);
        // Future: yahan backend POST /subscribe call
        subscribeForm.reset();
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const subscribeBtn = document.getElementById("subscribeBtn");

    subscribeBtn.addEventListener("click", function (e) {
        e.preventDefault(); // page reload nahi hoga

        // Alert message
        alert("🎉 Thank you for subscribing to LearnX! Your $14.99/month subscription is active.");

        // Optional: Button disable & change text
        subscribeBtn.textContent = "Subscribed ✅";
        subscribeBtn.classList.remove("btn-success");
        subscribeBtn.classList.add("btn-secondary");
        subscribeBtn.disabled = true;
    });
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