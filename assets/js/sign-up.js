const form = document.getElementById('signupForm');

form.addEventListener('submit', async function (e) {

  e.preventDefault();

  const fullName = form.querySelector('input[type="text"]').value.trim();
  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value.trim();
  const courseSelect = form.querySelector('select').value;
  const termsChecked = form.querySelector('#terms').checked;

  // ✅ Validation
  if (!fullName) {
    alert("Please enter your full name.");
    return;
  }

  if (!email) {
    alert("Please enter your email address.");
    return;
  }

  if (!validateEmail(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  if (!password) {
    alert("Please enter your password.");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters long.");
    return;
  }

  if (!courseSelect) {
    alert("Please select a course category.");
    return;
  }

  if (!termsChecked) {
    alert("You must agree to the Terms of Service.");
    return;
  }

  try {

    // 🔥 Send data to backend
    const res = await fetch("https://localhost:5000/api/auth/signup", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name: fullName,
        email: email,
        password: password,
        category: courseSelect
      })

    });

    const data = await res.json();

    // ✅ Success
    if (res.ok) {

      alert("Signup successful ✅");

      // save user locally
      localStorage.setItem("learnx_user", JSON.stringify({
        name: fullName,
        email: email
      }));

      form.reset();

      // redirect to login page
      window.location.href = "sign-in.html";

    } else {

      alert(data.message || "Signup failed ❌");

    }

  } catch (error) {

    console.error("Signup Error:", error);

    alert("Server error ❌");

  }

});

// ✅ Email Validation
function validateEmail(email) {

  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return re.test(email);

}