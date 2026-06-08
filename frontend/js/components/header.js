/* ==========================================================================
   SwiftCart Header (Navbar) Component
   ========================================================================== */

import { state, toggleTheme } from "../app.js";
import { API } from "../api.js";
import { showToast } from "../app.js";

export function renderHeader() {
  const header = document.getElementById("main-header");
  if (!header) return;

  const user = state.user;
  const cartItemsCount = state.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // Render Navbar HTML
  header.innerHTML = `
    <div class="nav-container">
      <!-- Logo -->
      <a href="#/" class="logo">
        <i data-lucide="shopping-bag"></i> Swift<span>Cart</span>
      </a>

      <!-- Search Bar -->
      <div class="search-bar-container">
        <form id="search-form">
          <div class="search-input-wrapper">
            <i data-lucide="search"></i>
            <input type="text" id="search-input" placeholder="Search brands, products, categories..." value="${getSearchQuery()}">
          </div>
        </form>
      </div>

      <!-- Actions -->
      <div class="nav-actions">
        <!-- Theme Toggle -->
        <button id="theme-toggle-btn" class="nav-btn" title="Toggle Theme">
          <i data-lucide="${state.theme === 'light' ? 'moon' : 'sun'}"></i>
        </button>

        <!-- Cart Icon -->
        <a href="#/cart" class="nav-btn" title="Shopping Cart">
          <i data-lucide="shopping-cart"></i>
          ${cartItemsCount > 0 ? `<span class="cart-badge">${cartItemsCount}</span>` : ""}
        </a>

        <!-- User Authentication Section -->
        <div class="auth-nav">
          ${user ? `
            <div class="user-menu">
              <button id="user-menu-trigger" class="user-trigger">
                <i data-lucide="user"></i>
                <span>Hi, ${user.firstName}</span>
                <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
              </button>
              <div id="user-dropdown-menu" class="user-dropdown">
                <a href="#/orders"><i data-lucide="package" style="width: 14px; height: 14px;"></i> My Orders</a>
                <hr>
                <button id="btn-logout" class="dropdown-logout-btn"><i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Logout</button>
              </div>
            </div>
          ` : `
            <a href="#/auth" class="btn btn-login">Login</a>
          `}
        </div>
      </div>
    </div>
  `;

  // Attach dynamic event listeners
  attachListeners();
}

function getSearchQuery() {
  const hash = window.location.hash;
  if (hash.startsWith("#/products")) {
    const params = new URLSearchParams(hash.split("?")[1] || "");
    return params.get("search") || "";
  }
  return "";
}

function attachListeners() {
  // 1. Theme toggle
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      toggleTheme();
    });
  }

  // 2. Search submission
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = document.getElementById("search-input").value.trim();
      if (query) {
        window.location.hash = `#/products?search=${encodeURIComponent(query)}`;
      } else {
        window.location.hash = `#/products`;
      }
    });
  }

  // 3. User Dropdown Toggle
  const userTrigger = document.getElementById("user-menu-trigger");
  const userDropdown = document.getElementById("user-dropdown-menu");
  if (userTrigger && userDropdown) {
    userTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });
  }

  // 4. Logout trigger
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await API.auth.logout();
        showToast("Logged out successfully.", "success");
        window.location.hash = "#/";
      } catch (err) {
        showToast(err.message || "Logout failed.", "error");
      }
    });
  }

  // Re-trigger Lucide icon render
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
