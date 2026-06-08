/* ==========================================================================
   SwiftCart Home Page Module
   ========================================================================== */

import { API } from "../api.js";
import { state, syncCartState, showToast } from "../app.js";

export async function renderHome(container) {
  // 1. Fetch newest products for featured grid
  let featuredProducts = [];
  try {
    const data = await API.products.getProducts({ limit: 4 });
    featuredProducts = data.products || [];
  } catch (err) {
    console.error("Failed to load featured products:", err);
  }

  // 2. Render HTML
  container.innerHTML = `
    <!-- Hero Banner -->
    <section class="hero">
      <div class="hero-content">
        <h2>Elevate Your Everyday</h2>
        <p>Explore our curated collection of premium shoes, smart gadgets, custom streetwear, and workspace aesthetics. Designed for those who value speed and quality.</p>
        <a href="#/products" class="btn btn-accent btn-lg">
          Shop Catalog <i data-lucide="arrow-right" style="width:16px; height:16px; display:inline-block; vertical-align:middle; margin-left:6px;"></i>
        </a>
      </div>
      <div class="hero-bg-img"></div>
    </section>

    <!-- Categories Navigation Section -->
    <section class="home-section">
      <div class="section-header">
        <h3 class="section-title">Shop by Category</h3>
      </div>
      <div class="categories-pills">
        <a href="#/products" class="category-pill active">
          <i data-lucide="layout-grid" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> All Products
        </a>
        <a href="#/products?category=Electronics" class="category-pill">
          <i data-lucide="smartphone" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Electronics
        </a>
        <a href="#/products?category=Footwear" class="category-pill">
          <i data-lucide="footprints" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Footwear
        </a>
        <a href="#/products?category=Apparel" class="category-pill">
          <i data-lucide="shirt" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Apparel
        </a>
        <a href="#/products?category=Home+%26+Living" class="category-pill">
          <i data-lucide="home" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Home & Living
        </a>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="home-section">
      <div class="section-header">
        <h3 class="section-title">Featured Arrivals</h3>
        <a href="#/products" style="color: var(--primary); font-size: 14px; font-weight: 600; display:flex; align-items:center; gap:4px;">
          View All <i data-lucide="chevron-right" style="width:16px; height:16px;"></i>
        </a>
      </div>

      <div class="products-grid">
        ${featuredProducts.length > 0 
          ? featuredProducts.map(product => renderProductCard(product)).join("")
          : renderSkeletons()
        }
      </div>
    </section>
  `;

  // Attach quick add to cart listeners
  attachHomeListeners(featuredProducts);
}

function renderProductCard(product) {
  const primaryImg = product.images.find(img => img.is_primary)?.url || product.images[0]?.url;
  const ratingVal = product.ratings?.average_rating || 0;
  const ratingCount = product.ratings?.total_reviews || 0;

  // Build rating stars
  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    starsHTML += `<i data-lucide="star" style="width: 13px; height: 13px; fill: ${i <= Math.round(ratingVal) ? 'currentColor' : 'none'};"></i>`;
  }

  return `
    <div class="product-card" data-id="${product._id}">
      <span class="badge-brand">${product.brand}</span>
      <a href="#/product/${product.slug}" class="card-img-container">
        <img src="${primaryImg}" alt="${product.title}" loading="lazy">
      </a>
      <div class="card-body">
        <h4 class="card-title">
          <a href="#/product/${product.slug}">${product.title}</a>
        </h4>
        <div class="card-rating">
          ${starsHTML}
          <span>(${ratingCount})</span>
        </div>
        <div class="card-footer">
          <span class="card-price">₹${product.base_price.toLocaleString("en-IN")}</span>
          <button class="btn-card-add" data-id="${product._id}" title="Quick Add to Cart">
            <i data-lucide="shopping-cart" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSkeletons() {
  let html = "";
  for (let i = 0; i < 4; i++) {
    html += `
      <div class="product-card skeleton-card" style="height: 380px; background-color: var(--bg-card); opacity: 0.6; display:flex; flex-direction:column; padding: 20px; gap: 15px;">
        <div style="background-color: var(--border-color); flex: 1; border-radius: var(--radius-md);"></div>
        <div style="background-color: var(--border-color); height: 20px; width: 80%; border-radius: 4px;"></div>
        <div style="background-color: var(--border-color); height: 16px; width: 40%; border-radius: 4px;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="background-color: var(--border-color); height: 24px; width: 30%; border-radius: 4px;"></div>
          <div style="background-color: var(--border-color); height: 36px; width: 36px; border-radius: var(--radius-full);"></div>
        </div>
      </div>
    `;
  }
  return html;
}

function attachHomeListeners(products) {
  const addButtons = document.querySelectorAll(".btn-card-add");
  addButtons.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!state.user) {
        showToast("Please log in to add items to your cart.", "warning");
        window.location.hash = "#/auth";
        return;
      }

      const prodId = btn.getAttribute("data-id");
      const product = products.find(p => p._id === prodId);
      
      if (!product) return;

      // Select first variant as default
      const defaultVariant = product.variants && product.variants[0];
      if (!defaultVariant) {
        showToast("This product has no stock variants available.", "error");
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i>`;
        if (window.lucide) window.lucide.createIcons();

        await API.cart.addItem(product._id, defaultVariant.sku, 1);
        showToast(`Added ${product.title} (${defaultVariant.attributes.map(a => a.value).join("/")}) to your cart!`, "success");
        await syncCartState();
      } catch (err) {
        showToast(err.message || "Failed to add item.", "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="shopping-cart" style="width: 16px; height: 16px;"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });
}
