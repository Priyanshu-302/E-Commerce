/* ==========================================================================
   SwiftCart Product Detail Page Module
   ========================================================================== */

import { API } from "../api.js";
import { state, syncCartState, showToast } from "../app.js";

export async function renderProductDetail(container, slug) {
  // 1. Fetch Product details from the database
  let product = null;
  try {
    const data = await API.products.getProductBySlug(slug);
    product = data.product;
  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <i data-lucide="alert-circle" style="width:48px; height:48px; color:var(--error); margin-bottom:16px;"></i>
        <h3 style="font-size:20px; margin-bottom:12px;">Failed to load product</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">${err.message || "Product not found."}</p>
        <a href="#/products" class="btn btn-primary">Back to Catalog</a>
      </div>
    `;
    return;
  }

  if (!product) return;

  // 2. Initialize Selection State
  // Extract all attributes from variants to find unique values
  const attributeGroups = {}; // e.g. { Color: ["Red", "Blue"], Size: ["9", "10"] }
  product.variants.forEach(variant => {
    variant.attributes.forEach(attr => {
      if (!attributeGroups[attr.name]) {
        attributeGroups[attr.name] = [];
      }
      if (!attributeGroups[attr.name].includes(attr.value)) {
        attributeGroups[attr.name].push(attr.value);
      }
    });
  });

  // Default selections: use the first variant's attributes
  const selectedAttributes = {};
  const defaultVariant = product.variants[0];
  if (defaultVariant) {
    defaultVariant.attributes.forEach(attr => {
      selectedAttributes[attr.name] = attr.value;
    });
  }

  let quantity = 1;
  let activeVariant = defaultVariant;
  let activeStock = 0;

  // 3. Define rendering functions (closures) to easily support re-rendering selections
  async function updateActiveVariantInfo() {
    // Find variant matching all selections
    activeVariant = product.variants.find(v => {
      return v.attributes.every(attr => selectedAttributes[attr.name] === attr.value);
    });

    if (activeVariant) {
      // Fetch stock level
      try {
        const stockData = await API.products.getStock(activeVariant.sku);
        activeStock = stockData.stock;
      } catch (err) {
        console.warn("Failed to check stock for variant:", activeVariant.sku);
        activeStock = 0;
      }
      
      // Update UI displays
      const priceText = document.getElementById("detail-price-display");
      if (priceText) {
        const displayPrice = activeVariant.price || product.base_price;
        priceText.textContent = `₹${displayPrice.toLocaleString("en-IN")}`;
      }

      const skuText = document.getElementById("detail-sku-display");
      if (skuText) {
        skuText.textContent = activeVariant.sku;
      }

      const stockBadge = document.getElementById("detail-stock-badge");
      const addToCartBtn = document.getElementById("btn-detail-add-cart");
      if (stockBadge && addToCartBtn) {
        if (activeStock > 0) {
          addToCartBtn.disabled = false;
          addToCartBtn.innerHTML = `<i data-lucide="shopping-cart"></i> Add to Cart`;
          if (activeStock <= 5) {
            stockBadge.className = "stock-status low-stock";
            stockBadge.innerHTML = `<span class="stock-dot"></span> Low Stock: Only ${activeStock} items left!`;
          } else {
            stockBadge.className = "stock-status in-stock";
            stockBadge.innerHTML = `<span class="stock-dot"></span> In Stock (${activeStock} available)`;
          }
        } else {
          addToCartBtn.disabled = true;
          addToCartBtn.innerHTML = `Out of Stock`;
          stockBadge.className = "stock-status out-of-stock";
          stockBadge.innerHTML = `<span class="stock-dot"></span> Sold Out`;
        }
      }
    } else {
      // No matching variant combination
      const addToCartBtn = document.getElementById("btn-detail-add-cart");
      if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = "Unavailable Selection";
      }
      const stockBadge = document.getElementById("detail-stock-badge");
      if (stockBadge) {
        stockBadge.className = "stock-status out-of-stock";
        stockBadge.textContent = "Selection is not offered";
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Initial render of page shell
  const primaryImg = product.images.find(img => img.is_primary)?.url || product.images[0]?.url;
  const ratingVal = product.ratings?.average_rating || 0;
  const ratingCount = product.ratings?.total_reviews || 0;

  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    starsHTML += `<i data-lucide="star" style="width: 15px; height: 15px; fill: ${i <= Math.round(ratingVal) ? 'currentColor' : 'none'};"></i>`;
  }

  container.innerHTML = `
    <div style="margin-top: 20px;">
      <!-- Breadcrumbs -->
      <p style="font-size: 13px; color: var(--text-light); margin-bottom: 24px;">
        <a href="#/">Home</a> / <a href="#/products">Catalog</a> / <span style="color: var(--text-main);">${product.title}</span>
      </p>

      <div class="detail-layout">
        <!-- Gallery Section -->
        <div class="gallery-container">
          <div class="main-image">
            <img src="${primaryImg}" id="detail-main-img" alt="${product.title}">
          </div>
          <div class="thumbnails-grid">
            ${product.images.map((img, idx) => `
              <div class="thumb-item ${img.url === primaryImg ? 'active' : ''}" data-url="${img.url}">
                <img src="${img.url}" alt="Thumbnail ${idx + 1}">
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Info Details Section -->
        <div class="detail-info">
          <span class="detail-brand">${product.brand}</span>
          <h1 class="detail-title">${product.title}</h1>
          
          <div class="detail-rating">
            ${starsHTML}
            <span>(${ratingCount} reviews)</span>
          </div>

          <div class="detail-price-box">
            <span class="detail-price" id="detail-price-display">₹${product.base_price.toLocaleString("en-IN")}</span>
          </div>

          <p class="detail-desc">${product.description}</p>

          <!-- Variant Attribute Selectors -->
          <div class="variants-container">
            ${Object.entries(attributeGroups).map(([name, values]) => `
              <div style="margin-bottom: 20px;">
                <h5 class="selector-title">${name}</h5>
                <div class="chips-group" data-attr-name="${name}">
                  ${values.map(val => `
                    <button class="chip-btn ${selectedAttributes[name] === val ? 'active' : ''}" data-attr-value="${val}">
                      ${val}
                    </button>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Stock Level Badge -->
          <div id="detail-stock-badge" class="stock-status in-stock">
            <span class="stock-dot"></span> Checking stock availability...
          </div>

          <!-- Quantity and Action Buttons -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; gap:16px; align-items:center;">
              <span style="font-size:13px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Quantity:</span>
              <div class="qty-selector">
                <button class="qty-btn" id="qty-minus" style="font-weight:600;"><i data-lucide="minus" style="width:14px; height:14px;"></i></button>
                <span id="qty-val">${quantity}</span>
                <button class="qty-btn" id="qty-plus" style="font-weight:600;"><i data-lucide="plus" style="width:14px; height:14px;"></i></button>
              </div>
            </div>

            <div class="detail-actions">
              <button id="btn-detail-add-cart" class="btn btn-primary" style="flex:1; padding: 14px 0;">
                <i data-lucide="shopping-cart"></i> Add to Cart
              </button>
              <a href="#/cart" class="btn btn-secondary" style="display:flex; align-items:center; justify-content:center; width: 50px; padding:0;">
                <i data-lucide="arrow-right"></i>
              </a>
            </div>
            
            <p style="font-size:12px; color:var(--text-muted);">
              Variant SKU: <strong id="detail-sku-display">...</strong>
            </p>
          </div>

          <!-- Specifications Table -->
          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-name">Brand</span>
              <span class="spec-value">${product.brand}</span>
            </div>
            ${product.attributes.map(attr => `
              <div class="spec-item">
                <span class="spec-name">${attr.name}</span>
                <span class="spec-value">${attr.value}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  // 4. Attach Listeners and perform initial stock check
  const mainImg = document.getElementById("detail-main-img");
  const thumbs = document.querySelectorAll(".thumb-item");
  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      const url = thumb.getAttribute("data-url");
      mainImg.src = url;
    });
  });

  // Attribute selector click handlers
  const chipGroups = document.querySelectorAll(".chips-group");
  chipGroups.forEach(group => {
    const attrName = group.getAttribute("data-attr-name");
    const chips = group.querySelectorAll(".chip-btn");

    chips.forEach(chip => {
      chip.addEventListener("click", async () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedAttributes[attrName] = chip.getAttribute("data-attr-value");
        await updateActiveVariantInfo();
      });
    });
  });

  // Quantity adjustments
  const qtyValText = document.getElementById("qty-val");
  document.getElementById("qty-minus").addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      qtyValText.textContent = quantity;
    }
  });

  document.getElementById("qty-plus").addEventListener("click", () => {
    if (quantity < activeStock) {
      quantity++;
      qtyValText.textContent = quantity;
    } else {
      showToast(`Cannot exceed available stock limit (${activeStock} items).`, "warning");
    }
  });

  // Add to Cart Action
  document.getElementById("btn-detail-add-cart").addEventListener("click", async (e) => {
    if (!state.user) {
      showToast("Please log in to add items to your cart.", "warning");
      window.location.hash = `#/auth?redirect=product/${slug}`;
      return;
    }

    if (!activeVariant) {
      showToast("Selected variant combination is invalid.", "error");
      return;
    }

    const addBtn = e.currentTarget;
    try {
      addBtn.disabled = true;
      addBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 16px; height: 16px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Adding...`;
      if (window.lucide) window.lucide.createIcons();

      await API.cart.addItem(product._id, activeVariant.sku, quantity);
      showToast(`Successfully added ${quantity}x ${product.title} to your cart.`, "success");
      await syncCartState();
    } catch (err) {
      showToast(err.message || "Failed to add items to cart.", "error");
    } finally {
      addBtn.disabled = false;
      addBtn.innerHTML = `<i data-lucide="shopping-cart"></i> Add to Cart`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Check stock and set initial variant details
  await updateActiveVariantInfo();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
