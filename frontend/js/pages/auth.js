/* ==========================================================================
   SwiftCart Authentication Page Module (Login / Sign Up)
   ========================================================================== */

import { API } from "../api.js";
import { syncCartState, showToast } from "../app.js";

export async function renderAuth(container) {
  // 1. Parse redirect parameter (so we can send the user back to cart/checkout on success)
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.split("?")[1] || "");
  const redirectTarget = params.get("redirect") || "/";

  let activeTab = "login"; // "login" or "signup"

  function renderLayout() {
    container.innerHTML = `
      <div class="auth-wrapper">
        <!-- Tab Headers -->
        <div class="auth-tabs">
          <div class="auth-tab ${activeTab === 'login' ? 'active' : ''}" id="tab-login-header">Login</div>
          <div class="auth-tab ${activeTab === 'signup' ? 'active' : ''}" id="tab-signup-header">Sign Up</div>
        </div>

        <!-- Forms Container -->
        <div class="auth-body" id="auth-forms-viewport">
          ${activeTab === 'login' ? renderLoginForm() : renderSignupForm()}
        </div>
      </div>
    `;

    attachAuthListeners();
  }

  function renderLoginForm() {
    return `
      <form id="form-login">
        <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">
          Log in with your email to access your cart and place orders.
        </p>

        <div class="form-group">
          <label for="login-email">Email Address</label>
          <input type="email" id="login-email" class="form-control" placeholder="customer@example.com" required>
        </div>

        <div class="form-group" style="margin-bottom: 24px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <label style="margin-bottom:0;">Password</label>
            <a href="#" style="font-size:12px; color:var(--primary); font-weight:500;">Forgot Password?</a>
          </div>
          <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
        </div>

        <button type="submit" id="btn-login-submit" class="btn btn-primary" style="width:100%; padding:14px 0; font-size:15px;">
          Sign In
        </button>

        <p style="font-size:13px; text-align:center; color:var(--text-muted); margin-top:20px;">
          Don't have an account? <span id="link-goto-signup" style="color:var(--primary); font-weight:600; cursor:pointer;">Create one here</span>
        </p>
      </form>
    `;
  }

  function renderSignupForm() {
    return `
      <form id="form-signup">
        <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">
          Join SwiftCart today for speed shopping and custom deals.
        </p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="signup-first">First Name</label>
            <input type="text" id="signup-first" class="form-control" placeholder="John" required>
          </div>
          <div class="form-group">
            <label for="signup-last">Last Name</label>
            <input type="text" id="signup-last" class="form-control" placeholder="Doe" required>
          </div>
        </div>

        <div class="form-group">
          <label for="signup-email">Email Address</label>
          <input type="email" id="signup-email" class="form-control" placeholder="customer@example.com" required>
        </div>

        <div class="form-group">
          <label for="signup-phone">Phone Number (Optional)</label>
          <input type="tel" id="signup-phone" class="form-control" placeholder="9876543210">
        </div>

        <div class="form-group" style="margin-bottom: 24px;">
          <label for="signup-password">Password (Min 6 chars)</label>
          <input type="password" id="signup-password" class="form-control" placeholder="••••••••" required>
        </div>

        <button type="submit" id="btn-signup-submit" class="btn btn-primary" style="width:100%; padding:14px 0; font-size:15px;">
          Create Account
        </button>

        <p style="font-size:13px; text-align:center; color:var(--text-muted); margin-top:20px;">
          Already have an account? <span id="link-goto-login" style="color:var(--primary); font-weight:600; cursor:pointer;">Sign in here</span>
        </p>
      </form>
    `;
  }

  function attachAuthListeners() {
    // 1. Tab switching
    const tabLogin = document.getElementById("tab-login-header");
    const tabSignup = document.getElementById("tab-signup-header");
    
    if (tabLogin && tabSignup) {
      tabLogin.addEventListener("click", () => {
        if (activeTab !== "login") {
          activeTab = "login";
          renderLayout();
        }
      });
      tabSignup.addEventListener("click", () => {
        if (activeTab !== "signup") {
          activeTab = "signup";
          renderLayout();
        }
      });
    }

    // Toggle links inside form
    const linkSignup = document.getElementById("link-goto-signup");
    if (linkSignup) {
      linkSignup.addEventListener("click", () => {
        activeTab = "signup";
        renderLayout();
      });
    }

    const linkLogin = document.getElementById("link-goto-login");
    if (linkLogin) {
      linkLogin.addEventListener("click", () => {
        activeTab = "login";
        renderLayout();
      });
    }

    // 2. Submit Login Form
    const loginForm = document.getElementById("form-login");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const loginBtn = document.getElementById("btn-login-submit");
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 14px; height: 14px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Signing In...`;
        if (window.lucide) window.lucide.createIcons();

        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-password").value;

        try {
          await API.auth.login(email, pass);
          showToast(`Welcome back to SwiftCart!`, "success");
          
          await syncCartState(); // Sync header cart counts
          
          // Redirect to target
          window.location.hash = `#${redirectTarget}`;
        } catch (err) {
          showToast(err.message || "Invalid credentials.", "error");
          loginBtn.disabled = false;
          loginBtn.textContent = "Sign In";
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    // 3. Submit Signup Form
    const signupForm = document.getElementById("form-signup");
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const signupBtn = document.getElementById("btn-signup-submit");
        signupBtn.disabled = true;
        signupBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 14px; height: 14px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Registering...`;
        if (window.lucide) window.lucide.createIcons();

        const first = document.getElementById("signup-first").value.trim();
        const last = document.getElementById("signup-last").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const phone = document.getElementById("signup-phone").value.trim() || null;
        const pass = document.getElementById("signup-password").value;

        if (pass.length < 6) {
          showToast("Password must be at least 6 characters.", "warning");
          signupBtn.disabled = false;
          signupBtn.textContent = "Create Account";
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        try {
          await API.auth.register(email, pass, first, last, phone);
          showToast("Registration successful! Please login below.", "success");
          
          // Switch to login tab and prefill email
          activeTab = "login";
          renderLayout();
          
          const emailInput = document.getElementById("login-email");
          if (emailInput) {
            emailInput.value = email;
          }
        } catch (err) {
          showToast(err.message || "Registration failed.", "error");
          signupBtn.disabled = false;
          signupBtn.textContent = "Create Account";
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Draw initial auth screen
  renderLayout();
}
