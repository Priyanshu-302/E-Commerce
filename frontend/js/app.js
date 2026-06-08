/* ==========================================================================
   SwiftCart Core Application Controller & Router
   ========================================================================== */

import { API, setOnAuthChange, getCurrentUser } from "./api.js";
import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { renderHome } from "./pages/home.js";
import { renderProducts } from "./pages/products.js";
import { renderProductDetail } from "./pages/product-detail.js";
import { renderCart } from "./pages/cart.js";
import { renderCheckout } from "./pages/checkout.js";
import { renderOrders } from "./pages/orders.js";
import { renderAuth } from "./pages/auth.js";

// Global Application State
export const state = {
  user: null,
  cart: null,
  theme: localStorage.getItem("theme") || "light"
};

/**
 * Toast Notification Helper
 */
export function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let iconName = "info";
  if (type === "success") iconName = "check-circle";
  if (type === "error") iconName = "alert-circle";
  if (type === "warning") iconName = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span class="toast-message">${message}</span>
    <span class="toast-close"><i data-lucide="x"></i></span>
  `;
  
  container.appendChild(toast);
  
  // Initialize icons inside toast
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        class: "lucide-icon"
      },
      nameAttr: "data-lucide"
    });
  }

  const closeToast = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  };

  toast.querySelector(".toast-close").addEventListener("click", closeToast);
  setTimeout(closeToast, 4000);
}

/**
 * Modal Portal Helpers
 */
export function showModal(contentHTML, onRender = null) {
  const portal = document.getElementById("modal-portal");
  const body = document.getElementById("modal-body");
  
  body.innerHTML = contentHTML;
  portal.classList.remove("hidden");
  
  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (onRender) {
    onRender(body);
  }

  // Handle Close buttons inside modal
  const closeBtns = body.querySelectorAll("[data-modal-close]");
  closeBtns.forEach(btn => {
    btn.addEventListener("click", hideModal);
  });
}

export function hideModal() {
  const portal = document.getElementById("modal-portal");
  portal.classList.add("hidden");
  document.getElementById("modal-body").innerHTML = "";
}

/**
 * Update the dynamic cart count across header.
 */
export async function syncCartState() {
  if (state.user) {
    try {
      const data = await API.cart.getCart();
      state.cart = data.cart;
    } catch (e) {
      console.warn("Failed to fetch cart state", e);
      state.cart = null;
    }
  } else {
    state.cart = null;
  }
  renderHeader();
}

/**
 * Theme toggle handler
 */
export function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  applyTheme();
  renderHeader();
}

function applyTheme() {
  const html = document.documentElement;
  if (state.theme === "dark") {
    html.classList.add("dark-mode");
  } else {
    html.classList.remove("dark-mode");
  }
}

/**
 * SPA Router
 */
export async function router() {
  const viewport = document.getElementById("main-viewport");
  const loader = document.getElementById("app-loader");
  
  // Show spinner
  viewport.innerHTML = `<div class="loader-container"><div class="spinner"></div></div>`;

  const hash = window.location.hash || "#/";
  
  try {
    // Route matching
    if (hash === "#/" || hash === "") {
      await renderHome(viewport);
    } 
    else if (hash.startsWith("#/products")) {
      await renderProducts(viewport);
    } 
    else if (hash.startsWith("#/product/")) {
      const slug = hash.replace("#/product/", "");
      await renderProductDetail(viewport, slug);
    } 
    else if (hash === "#/cart") {
      await renderCart(viewport);
    } 
    else if (hash === "#/checkout") {
      // Guard route
      if (!state.user) {
        showToast("Please log in to proceed to checkout.", "warning");
        window.location.hash = "#/auth?redirect=checkout";
        return;
      }
      await renderCheckout(viewport);
    } 
    else if (hash.startsWith("#/orders")) {
      // Guard route
      if (!state.user) {
        showToast("Please log in to view your orders.", "warning");
        window.location.hash = "#/auth?redirect=orders";
        return;
      }
      
      const orderId = hash.replace("#/orders/", "").replace("#/orders", "");
      await renderOrders(viewport, orderId || null);
    } 
    else if (hash.startsWith("#/auth")) {
      // If already logged in, redirect home
      if (state.user) {
        window.location.hash = "#/";
        return;
      }
      await renderAuth(viewport);
    } 
    else {
      // 404 View
      viewport.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
          <h2 style="font-size: 48px; color: var(--primary); margin-bottom: 16px;">404</h2>
          <p style="color: var(--text-muted); margin-bottom: 24px;">Oops! The page you are looking for does not exist.</p>
          <a href="#/" class="btn btn-primary">Go back home</a>
        </div>
      `;
    }
  } catch (error) {
    console.error("Router Error:", error);
    viewport.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <h3 style="font-size: 24px; color: var(--error); margin-bottom: 16px;">Error Loading Page</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">${error.message || "An unexpected error occurred."}</p>
        <button onclick="window.location.reload()" class="btn btn-primary">Reload Page</button>
      </div>
    `;
  }

  // Refresh icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Bootstrap Application
 */
async function init() {
  applyTheme();
  
  // 1. Setup Auth Change Callback
  setOnAuthChange(async (user) => {
    state.user = user;
    renderHeader();
    
    // Fetch cart count when user logs in/out
    if (user) {
      try {
        const cartData = await API.cart.getCart();
        state.cart = cartData;
      } catch (err) {
        console.warn("Failed to retrieve cart on login refresh", err);
      }
    } else {
      state.cart = null;
    }
    renderHeader();
  });

  // 2. Render static footer
  renderFooter();

  // 3. Attempt silent refresh (auto-login)
  const loaderContainer = document.getElementById("app-loader");
  try {
    await API.auth.refresh();
  } catch (e) {
    console.log("No existing session found.");
  }

  // 4. Initial Header rendering
  renderHeader();

  // 5. Start router
  window.addEventListener("hashchange", router);
  router();

  // Close user dropdown if clicking outside
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("user-dropdown-menu");
    const trigger = document.getElementById("user-menu-trigger");
    if (dropdown && dropdown.classList.contains("show")) {
      if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
      }
    }
  });
}

// Start application
document.addEventListener("DOMContentLoaded", init);
