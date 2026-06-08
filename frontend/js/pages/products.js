/* ==========================================================================
   SwiftCart Products Catalog Page Module
   ========================================================================== */

import { API } from "../api.js";
import { state, syncCartState, showToast } from "../app.js";

export async function renderProducts(container) {
  // 1. Parse hash query params
  const hash = window.location.hash;
  const queryString = hash.split("?")[1] || "";
  const queryParams = new URLSearchParams(queryString);
  
  const searchParam = queryParams.get("search") || "";
  const categoryParam = queryParams.get("category") || "";
  const brandParam = queryParams.get("brand") || "";
  const minPriceParam = queryParams.get("minPrice") || "";
  const maxPriceParam = queryParams.get("maxPrice") || "";
  const sortParam = queryParams.get("sort") || "newest";
  const pageParam = parseInt(queryParams.get("page") || "1", 10);

  // 2. Fetch categories to map the selected category name/slug to an ObjectId
  let categories = [];
  let categoryObjectId = "";
  try {
    const catData = await API.products.getCategories();
    categories = catData.categories || [];
    
    if (categoryParam) {
      const matchedCat = categories.find(
        cat => cat.name.toLowerCase() === categoryParam.toLowerCase() || cat.slug === categoryParam
      );
      if (matchedCat) {
        categoryObjectId = matchedCat._id;
      }
    }
  } catch (err) {
    console.error("Failed to load categories for filtering:", err);
  }

  // 3. Query the Products Catalog API
  let productsData = { products: [], totalPages: 1, totalCount: 0 };
  let fetchError = null;

  try {
    const response = await API.products.getProducts({
      category: categoryObjectId,
      brand: brandParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      search: searchParam,
      page: pageParam,
      limit: 9,
    });
    
    productsData = response;
  } catch (err) {
    console.error("Failed to fetch products catalog:", err);
    fetchError = err.message;
  }

  // Client-side sorting on the array if needed (backend returns newest first)
  let productList = [...(productsData.products || [])];
  if (sortParam === "price-low") {
    productList.sort((a, b) => a.base_price - b.base_price);
  } else if (sortParam === "price-high") {
    productList.sort((a, b) => b.base_price - a.base_price);
  } else if (sortParam === "rating") {
    productList.sort((a, b) => (b.ratings?.average_rating || 0) - (a.ratings?.average_rating || 0));
  }

  // Collect unique brands from seeded catalog for filter checklists (defaults if fetch fails)
  const uniqueBrands = ["Aeros", "TimberCraft", "SonicX", "Chronos", "SwiftThreads"];

  // 4. Render Layout HTML
  container.innerHTML = `
    <div style="margin-top: 20px;">
      <!-- Breadcrumbs / Title -->
      <div style="margin-bottom: 24px;">
        <p style="font-size: 13px; color: var(--text-light); margin-bottom: 8px;">
          <a href="#/">Home</a> / <span style="color: var(--text-main);">Catalog</span>
        </p>
        <h2 style="font-size: 28px;">
          ${searchParam ? `Search Results for "${searchParam}"` : categoryParam ? `${categoryParam} Collection` : "All Products"}
          <span style="font-size: 14px; font-weight: 500; color: var(--text-muted); margin-left: 10px;">
            (${productsData.totalCount || productList.length} items)
          </span>
        </h2>
      </div>

      <!-- Main Layout -->
      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 30px;">
        
        <!-- Sidebar Filters -->
        <aside style="background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; align-self: flex-start;">
          <h4 style="font-size: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
            Filters
            <button id="btn-clear-filters" style="font-size:12px; color:var(--primary); font-weight:600;">Clear All</button>
          </h4>

          <!-- Categories List -->
          <div style="margin-bottom: 24px;">
            <h5 class="selector-title">Categories</h5>
            <ul style="list-style:none;">
              <li style="margin-bottom:8px;">
                <a href="#/products" class="filter-category-link ${!categoryParam ? 'active-link' : ''}" style="font-size:14px; color:${!categoryParam ? 'var(--primary)' : 'var(--text-muted)'}; font-weight:${!categoryParam ? '600' : '400'}">All Categories</a>
              </li>
              ${categories.map(cat => `
                <li style="margin-bottom:8px;">
                  <a href="#/products?category=${encodeURIComponent(cat.name)}" class="filter-category-link ${categoryParam.toLowerCase() === cat.name.toLowerCase() ? 'active-link' : ''}" style="font-size:14px; color:${categoryParam.toLowerCase() === cat.name.toLowerCase() ? 'var(--primary)' : 'var(--text-muted)'}; font-weight:${categoryParam.toLowerCase() === cat.name.toLowerCase() ? '600' : '400'}">
                    ${cat.name}
                  </a>
                </li>
              `).join("")}
            </ul>
          </div>

          <!-- Price Filter -->
          <div style="margin-bottom: 24px;">
            <h5 class="selector-title">Price Range (₹)</h5>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="number" id="filter-min-price" class="form-control" placeholder="Min" value="${minPriceParam}" style="padding: 6px 10px; font-size:12px;">
              <span style="color:var(--text-light)">-</span>
              <input type="number" id="filter-max-price" class="form-control" placeholder="Max" value="${maxPriceParam}" style="padding: 6px 10px; font-size:12px;">
            </div>
            <button id="btn-apply-price" class="btn btn-secondary" style="width:100%; padding:8px 0; margin-top:12px; font-size:12px; font-weight:600;">Apply Price</button>
          </div>

          <!-- Brand Filter -->
          <div style="margin-bottom: 20px;">
            <h5 class="selector-title">Brands</h5>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${uniqueBrands.map(b => `
                <label style="display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer;">
                  <input type="checkbox" class="brand-checkbox" value="${b}" ${brandParam === b ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--primary);">
                  ${b}
                </label>
              `).join("")}
            </div>
          </div>
        </aside>

        <!-- Main Product Feed Area -->
        <div>
          <!-- Feed Controls -->
          <div style="display:flex; justify-content:space-between; align-items:center; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 20px; margin-bottom: 24px;">
            <p style="font-size:14px; color: var(--text-muted);">
              Showing <span style="font-weight:600; color:var(--text-main);">${productList.length}</span> of <span style="font-weight:600; color:var(--text-main);">${productsData.totalCount || productList.length}</span> products
            </p>
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:14px; color:var(--text-muted)">Sort by:</span>
              <select id="sort-select" style="padding: 6px 12px; background-color:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-sm); font-size:13px; font-weight:500;">
                <option value="newest" ${sortParam === "newest" ? "selected" : ""}>Newest Arrivals</option>
                <option value="price-low" ${sortParam === "price-low" ? "selected" : ""}>Price: Low to High</option>
                <option value="price-high" ${sortParam === "price-high" ? "selected" : ""}>Price: High to Low</option>
                <option value="rating" ${sortParam === "rating" ? "selected" : ""}>Customer Rating</option>
              </select>
            </div>
          </div>

          <!-- Product Feed Grid -->
          ${fetchError ? `
            <div style="text-align:center; padding: 60px 0; color:var(--error);">
              <i data-lucide="alert-triangle" style="width:40px; height:40px; margin-bottom:12px;"></i>
              <p>Failed to load products: ${fetchError}</p>
            </div>
          ` : productList.length === 0 ? `
            <div style="text-align:center; padding: 80px 0; background-color: var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg);">
              <i data-lucide="info" style="width:48px; height:48px; color:var(--text-light); margin-bottom:16px;"></i>
              <p style="font-size:16px; color:var(--text-muted); font-weight:500; margin-bottom:12px;">No products match your filters</p>
              <p style="font-size:14px; color:var(--text-light); margin-bottom:20px;">Try adjusting your keywords or clearing the filter sidebar.</p>
              <button id="btn-reset-catalog" class="btn btn-primary">Reset Catalog Filters</button>
            </div>
          ` : `
            <div class="products-grid">
              ${productList.map(product => renderCatalogCard(product)).join("")}
            </div>
            
            <!-- Pagination Controls -->
            ${productsData.totalPages > 1 ? `
              <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:40px;">
                <button class="btn btn-secondary pagination-btn" data-page="${pageParam - 1}" ${pageParam === 1 ? 'disabled' : ''} style="padding: 8px 16px;">
                  <i data-lucide="chevron-left" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> Prev
                </button>
                <span style="font-size:14px; color:var(--text-muted);">Page <strong>${pageParam}</strong> of <strong>${productsData.totalPages}</strong></span>
                <button class="btn btn-secondary pagination-btn" data-page="${pageParam + 1}" ${pageParam === productsData.totalPages ? 'disabled' : ''} style="padding: 8px 16px;">
                  Next <i data-lucide="chevron-right" style="width:16px; height:16px; vertical-align:middle; margin-left:4px;"></i>
                </button>
              </div>
            ` : ""}
          `}
        </div>
      </div>
    </div>
  `;

  // 5. Attach event listeners
  attachCatalogListeners(productList, queryParams);
}

function renderCatalogCard(product) {
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

function attachCatalogListeners(products, queryParams) {
  // 1. Sort Selection dropdown
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      queryParams.set("sort", e.target.value);
      queryParams.delete("page"); // Reset page back to 1 on sort change
      window.location.hash = `#/products?${queryParams.toString()}`;
    });
  }

  // 2. Clear filters button
  const clearBtn = document.getElementById("btn-clear-filters");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      window.location.hash = `#/products`;
    });
  }

  // 3. Reset filters button inside empty grid view
  const resetBtn = document.getElementById("btn-reset-catalog");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      window.location.hash = `#/products`;
    });
  }

  // 4. Apply Price filter
  const applyPriceBtn = document.getElementById("btn-apply-price");
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener("click", () => {
      const min = document.getElementById("filter-min-price").value.trim();
      const max = document.getElementById("filter-max-price").value.trim();
      
      if (min) queryParams.set("minPrice", min);
      else queryParams.delete("minPrice");

      if (max) queryParams.set("maxPrice", max);
      else queryParams.delete("maxPrice");

      queryParams.delete("page");
      window.location.hash = `#/products?${queryParams.toString()}`;
    });
  }

  // 5. Brand Checkbox triggers
  const brandCheckboxes = document.querySelectorAll(".brand-checkbox");
  brandCheckboxes.forEach(cb => {
    cb.addEventListener("change", (e) => {
      if (e.target.checked) {
        // For simplicity, we filter by one brand at a time in the backend, 
        // but let's toggle it here.
        queryParams.set("brand", e.target.value);
      } else {
        queryParams.delete("brand");
      }
      queryParams.delete("page");
      window.location.hash = `#/products?${queryParams.toString()}`;
    });
  });

  // 6. Pagination Page button triggers
  const pageButtons = document.querySelectorAll(".pagination-btn");
  pageButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPage = btn.getAttribute("data-page");
      queryParams.set("page", targetPage);
      window.location.hash = `#/products?${queryParams.toString()}`;
    });
  });

  // 7. Quick Add to Cart button triggers
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
        showToast(`Added ${product.title} to your cart!`, "success");
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

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
