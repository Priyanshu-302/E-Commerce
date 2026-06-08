/* ==========================================================================
   SwiftCart Cart Page Module
   ========================================================================== */

import { API } from "../api.js";
import { state, syncCartState, showToast } from "../app.js";

export async function renderCart(container) {
  // 1. Guard route: Login check
  if (!state.user) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <i data-lucide="shopping-cart" style="width:48px; height:48px; color:var(--text-light); margin-bottom:16px;"></i>
        <h3 style="font-size:22px; margin-bottom:12px;">Your cart is empty</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Please log in to view or manage your shopping cart.</p>
        <a href="#/auth?redirect=cart" class="btn btn-primary">Login / Sign Up</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // 2. Fetch cart contents
  let cart = null;
  let fetchError = null;

  try {
    const data = await API.cart.getCart();
    cart = data.cart;
  } catch (err) {
    fetchError = err.message;
  }

  if (fetchError) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px; color:var(--error);">
        <i data-lucide="alert-triangle" style="width:40px; height:40px; margin-bottom:12px;"></i>
        <p>Failed to load cart: ${fetchError}</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top:16px;">Try Again</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <i data-lucide="shopping-cart" style="width:56px; height:56px; color:var(--text-light); margin-bottom:16px;"></i>
        <h3 style="font-size:24px; margin-bottom:12px;">Your cart is empty</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Browse our premium selection and add items to your cart.</p>
        <a href="#/products" class="btn btn-primary">Continue Shopping</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // 3. Pricing calculations
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal >= 5000 ? 0 : 150; // Free shipping over ₹5000
  const tax = Math.round(subtotal * 0.18); // 18% GST estimate
  const grandTotal = subtotal + shipping + tax;

  // 4. Render Layout HTML
  container.innerHTML = `
    <div style="margin-top: 20px;">
      <h2 style="font-size:28px; margin-bottom:24px;">Shopping Cart</h2>

      <div class="cart-layout">
        <!-- Cart Items List -->
        <div class="cart-list">
          ${items.map(item => `
            <div class="cart-item" data-item-id="${item.id}" data-sku="${item.sku}">
              <div class="cart-item-img">
                <img src="${item.image}" alt="${item.name}">
              </div>
              <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-variant">SKU: ${item.sku}</p>
                <p class="cart-item-price">₹${item.price.toLocaleString("en-IN")}</p>
              </div>
              
              <div class="cart-item-actions">
                <!-- Quantity Adjuster -->
                <div class="qty-selector">
                  <button class="qty-btn btn-cart-qty-minus" style="font-weight:600;"><i data-lucide="minus" style="width:12px; height:12px;"></i></button>
                  <span class="cart-qty-val" style="width:24px; text-align:center; font-weight:600;">${item.quantity}</span>
                  <button class="qty-btn btn-cart-qty-plus" style="font-weight:600;"><i data-lucide="plus" style="width:12px; height:12px;"></i></button>
                </div>

                <div style="font-family: var(--font-heading); font-weight:700; width:100px; text-align:right;">
                  ₹${(item.price * item.quantity).toLocaleString("en-IN")}
                </div>

                <button class="btn-remove-item" title="Delete Item">
                  <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
                </button>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Cart Summary Panel -->
        <div class="cart-summary">
          <h3 class="summary-title">Order Summary</h3>
          
          <div class="summary-row">
            <span>Subtotal (${items.length} items)</span>
            <span>₹${subtotal.toLocaleString("en-IN")}</span>
          </div>
          
          <div class="summary-row">
            <span>Estimated Shipping</span>
            <span>${shipping === 0 ? '<strong style="color:var(--success)">FREE</strong>' : `₹${shipping}`}</span>
          </div>

          <div class="summary-row">
            <span>GST (18% Estimate)</span>
            <span>₹${tax.toLocaleString("en-IN")}</span>
          </div>

          <div class="summary-row total">
            <span>Grand Total</span>
            <span>₹${grandTotal.toLocaleString("en-IN")}</span>
          </div>

          <a href="#/checkout" class="btn btn-primary" style="width:100%; padding:14px 0; font-size:15px; margin-bottom:12px;">
            Proceed to Checkout
          </a>
          <a href="#/products" class="btn btn-secondary" style="width:100%; padding:12px 0;">
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  `;

  // 5. Attach event listeners
  attachCartListeners(container, items);
}

function attachCartListeners(container, items) {
  const cartItemRows = container.querySelectorAll(".cart-item");
  
  cartItemRows.forEach(row => {
    const itemId = row.getAttribute("data-item-id");
    const sku = row.getAttribute("data-sku");
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // A. Quantity Minus
    const minusBtn = row.querySelector(".btn-cart-qty-minus");
    minusBtn.addEventListener("click", async () => {
      if (item.quantity > 1) {
        await updateQuantity(itemId, item.quantity - 1, sku);
      } else {
        await deleteItem(itemId, item.name);
      }
    });

    // B. Quantity Plus
    const plusBtn = row.querySelector(".btn-cart-qty-plus");
    plusBtn.addEventListener("click", async () => {
      await updateQuantity(itemId, item.quantity + 1, sku);
    });

    // C. Remove Item Trashcan
    const removeBtn = row.querySelector(".btn-remove-item");
    removeBtn.addEventListener("click", async () => {
      await deleteItem(itemId, item.name);
    });
  });

  // Helper: Update Quantity
  async function updateQuantity(itemId, newQty, sku) {
    try {
      await API.cart.updateItem(itemId, newQty, sku);
      showToast("Cart quantity updated.", "success");
      await syncCartState();
      await renderCart(container); // Re-render cart page
    } catch (err) {
      showToast(err.message || "Failed to update quantity.", "error");
    }
  }

  // Helper: Delete Item
  async function deleteItem(itemId, name) {
    try {
      await API.cart.removeItem(itemId);
      showToast(`Removed "${name}" from your cart.`, "success");
      await syncCartState();
      await renderCart(container); // Re-render cart page
    } catch (err) {
      showToast(err.message || "Failed to remove item.", "error");
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
