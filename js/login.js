const baseApi = "http://13.201.26.101"
// Form switching
function switchToRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  clearMessages();
}

function switchToLogin() {
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  clearMessages();
}

// Password toggle
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.parentNode.querySelector(".password-toggle i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Clear messages
function clearMessages() {
  document
    .querySelectorAll(".error-message, .success-message")
    .forEach((msg) => {
      msg.style.display = "none";
      msg.textContent = "";
    });
}

// Show message
function showMessage(elementId, message, isError = true) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.display = "block";

  // Hide after 5 seconds
  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

// Loading state
function setLoadingState(form, isLoading) {
  const button = form.querySelector(".submit-btn");
  const btnText = button.querySelector(".btn-text");
  const loading = button.querySelector(".loading");

  if (isLoading) {
    button.disabled = true;
    btnText.style.display = "none";
    loading.style.display = "inline-block";
  } else {
    button.disabled = false;
    btnText.style.display = "inline";
    loading.style.display = "none";
  }
}

// Login form submission
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    clearMessages();
    setLoadingState(this, true);

    const formData = new FormData(this);
    const loginData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch(`${baseApi}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();
      console.log(result);

      if (result.success) {
        // Store token and user data in localStorage
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        showMessage("loginSuccess", "Login successful! Redirecting...", false);

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        // Handle error response
        const errorMessage =
          result.message || "Login failed. Please try again.";
        showMessage("loginError", errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage(
        "loginError",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoadingState(this, false);
    }
  });

// Registration form submission
document
  .getElementById("registerForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    clearMessages();

    const formData = new FormData(this);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Client-side validation
    if (password !== confirmPassword) {
      showMessage("registerError", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showMessage(
        "registerError",
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (!formData.get("agreeTerms")) {
      showMessage("registerError", "Please agree to the Terms & Conditions.");
      return;
    }

    setLoadingState(this, true);

    const registerData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: password,
    };

    try {
      const response = await axios.post(
        `${baseApi}/api/auth/register`,
        registerData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = response.data;

      if (result.success) {
        showMessage(
          "registerSuccess",
          result.message || "Account created successfully! Please sign in.",
          false
        );

        setTimeout(() => {
          switchToLogin();
          // Pre-fill email in login form
          document.getElementById("loginEmail").value = registerData.email;
        }, 2000);
      } else {
        // Handle error response
        const errorMessage =
          result.message || "Registration failed. Please try again.";
        showMessage("registerError", errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage =
        "Network error. Please check your connection and try again.";

      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }

      showMessage("registerError", errorMessage);
    } finally {
      setLoadingState(this, false);
    }
  });

// Social login
function socialLogin(provider) {
  alert(`${provider} login integration would be implemented here`);
}

// Check if user is already logged in
/*document.addEventListener('DOMContentLoaded', function() {
            const token = localStorage.getItem('authToken');
            if (token) {
                // Verify token with backend before redirecting
                verifyToken(token).then(isValid => {
                    if (isValid) {
                        window.location.href = 'dashboard.html';
                    } else {
                        // Clear invalid token
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('user');
                    }
                });
            }
        });

        // Verify token function
        async function verifyToken(token) {
            try {
                const response = await fetch('http://localhost:5000/api/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.ok;
            } catch (error) {
                console.error('Token verification error:', error);
                return false;
            }
        }*/

// Add CORS handling utility
function handleCORSError(error) {
  if (error.message.includes("CORS") || error.message.includes("fetch")) {
    return `Unable to connect to server. Please ensure the backend is running on ${baseApi} and CORS is properly configured.`;
  }
  return "Network error. Please try again.";
}

// Form validation enhancements
document.querySelectorAll("input[required]").forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.value.trim() === "") {
      this.style.borderColor = "var(--danger-color)";
    } else {
      this.style.borderColor = "var(--border-color)";
    }
  });

  input.addEventListener("input", function () {
    if (this.style.borderColor === "rgb(231, 76, 60)") {
      this.style.borderColor = "var(--border-color)";
    }
  });
});

// Email validation
document.querySelectorAll('input[type="email"]').forEach((input) => {
  input.addEventListener("blur", function () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.value && !emailRegex.test(this.value)) {
      this.style.borderColor = "var(--danger-color)";
    }
  });
});