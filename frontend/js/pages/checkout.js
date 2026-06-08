/* ==========================================================================
   SwiftCart Checkout Page Module
   ========================================================================== */

import { API } from "../api.js";
import { state, syncCartState, showToast, showModal, hideModal } from "../app.js";

export async function renderCheckout(container) {
  // 1. Fetch saved addresses
  let addresses = [];
  let cartData = null;
  let loadingError = null;

  try {
    const addrData = await API.addresses.getAddresses();
    addresses = addrData.addresses || [];
    
    const cData = await API.cart.getCart();
    cartData = cData.cart;
  } catch (err) {
    loadingError = err.message;
  }

  if (loadingError) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px; color:var(--error);">
        <i data-lucide="alert-triangle" style="width:40px; height:40px; margin-bottom:12px;"></i>
        <p>Failed to load checkout details: ${loadingError}</p>
        <a href="#/cart" class="btn btn-primary" style="margin-top:16px;">Back to Cart</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const items = cartData?.items || [];
  if (items.length === 0) {
    showToast("Your cart is empty. Cannot checkout.", "warning");
    window.location.hash = "#/cart";
    return;
  }

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal >= 5000 ? 0 : 150;
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shipping + tax;

  let selectedAddressId = addresses.find(a => a.is_default)?.id || addresses[0]?.id || null;

  // 2. Render Checkout shell (Closures for updating sub-views)
  function renderLayout() {
    container.innerHTML = `
      <div style="margin-top: 20px;">
        <h2 style="font-size:28px; margin-bottom:24px;">Checkout</h2>

        <div class="checkout-layout">
          <!-- Left Column: Steps -->
          <div>
            <!-- Step 1: Shipping Address -->
            <div class="checkout-step" id="checkout-address-step">
              <h3 class="step-title">
                <span class="step-number">1</span> Shipping Address
              </h3>
              
              <div class="address-grid" id="checkout-addresses-list">
                ${addresses.map(addr => `
                  <div class="address-card ${addr.id === selectedAddressId ? 'selected' : ''}" data-addr-id="${addr.id}">
                    <i class="selected-icon" data-lucide="check-circle-2" style="width:16px; height:16px;"></i>
                    <h5>Delivery Location</h5>
                    <p style="font-weight: 500; margin-bottom:4px; color:var(--text-main);">${addr.street_line1}</p>
                    ${addr.street_line2 ? `<p style="margin-bottom:2px;">${addr.street_line2}</p>` : ""}
                    <p>${addr.city}, ${addr.state} - ${addr.postal_code}</p>
                    <p style="font-size:11px; margin-top:6px; font-weight:600; color:var(--primary);">${addr.country}</p>
                  </div>
                `).join("")}
              </div>

              <button id="btn-add-address-checkout" class="btn btn-secondary" style="font-size:13px; padding:10px 18px;">
                <i data-lucide="plus" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Add New Address
              </button>
            </div>

            <!-- Step 2: Payment Method (initially hidden or collapsed until order placed) -->
            <div class="checkout-step" id="checkout-payment-step" style="opacity: 0.5; pointer-events: none;">
              <h3 class="step-title">
                <span class="step-number">2</span> Payment & Review
              </h3>
              
              <div id="payment-form-container">
                <p style="color:var(--text-muted); font-size:14px; margin-bottom:20px;">
                  Complete your order placement to open secure payment gateway.
                </p>
              </div>
            </div>
          </div>

          <!-- Right Column: Order Review Summary -->
          <div class="cart-summary" style="position: sticky; top: calc(var(--header-height) + 20px);">
            <h3 class="summary-title" style="font-size:18px;">Order Details</h3>
            
            <div style="max-height: 180px; overflow-y: auto; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              ${items.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:13px;">
                  <div style="max-width:70%;">
                    <p style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</p>
                    <p style="font-size:11px; color:var(--text-muted)">Qty: ${item.quantity} | SKU: ${item.sku}</p>
                  </div>
                  <span style="font-weight:600;">₹${(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              `).join("")}
            </div>

            <div class="summary-row" style="font-size:13px;">
              <span>Subtotal</span>
              <span>₹${subtotal.toLocaleString("en-IN")}</span>
            </div>
            
            <div class="summary-row" style="font-size:13px;">
              <span>Shipping</span>
              <span>${shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>

            <div class="summary-row" style="font-size:13px;">
              <span>GST (18%)</span>
              <span>₹${tax.toLocaleString("en-IN")}</span>
            </div>

            <div class="summary-row total" style="font-size:16px; margin-bottom: 20px;">
              <span>Amount Payable</span>
              <span>₹${grandTotal.toLocaleString("en-IN")}</span>
            </div>

            <button id="btn-place-order" class="btn btn-primary" style="width:100%; padding:14px 0; font-size:15px;" ${!selectedAddressId ? 'disabled' : ''}>
              Place Order
            </button>
          </div>
        </div>
      </div>
    `;

    attachCheckoutListeners();
  }

  function attachCheckoutListeners() {
    // 1. Select Address trigger
    const addressCards = container.querySelectorAll(".address-card");
    addressCards.forEach(card => {
      card.addEventListener("click", () => {
        addressCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedAddressId = card.getAttribute("data-addr-id");
        
        const placeOrderBtn = document.getElementById("btn-place-order");
        if (placeOrderBtn) placeOrderBtn.disabled = false;
      });
    });

    // 2. Open Add Address Modal
    const addAddressBtn = document.getElementById("btn-add-address-checkout");
    if (addAddressBtn) {
      addAddressBtn.addEventListener("click", () => {
        showAddAddressModal();
      });
    }

    // 3. Place Order trigger
    const placeOrderBtn = document.getElementById("btn-place-order");
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", async () => {
        if (!selectedAddressId) {
          showToast("Please select a shipping address.", "warning");
          return;
        }

        try {
          placeOrderBtn.disabled = true;
          placeOrderBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 14px; height: 14px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Processing...`;
          if (window.lucide) window.lucide.createIcons();

          const orderResponse = await API.orders.checkout(selectedAddressId);
          showToast("Order placed successfully! Please complete payment.", "success");
          
          await syncCartState(); // Sync header cart badge (it has been cleared by checkout)
          
          // Transition to Payment step
          showPaymentStep(orderResponse.orderId, orderResponse.amount);
        } catch (err) {
          showToast(err.message || "Failed to create order.", "error");
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = "Place Order";
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function showPaymentStep(orderId, amount) {
    const addressStep = document.getElementById("checkout-address-step");
    const paymentStep = document.getElementById("checkout-payment-step");
    const rightPanel = container.querySelector(".cart-summary");

    // Collapsed address step
    addressStep.style.opacity = "0.5";
    addressStep.style.pointerEvents = "none";
    
    // Enable payment step
    paymentStep.style.opacity = "1";
    paymentStep.style.pointerEvents = "auto";

    // Disable place order button on right panel
    const placeBtn = document.getElementById("btn-place-order");
    if (placeBtn) {
      placeBtn.style.display = "none";
    }

    // Render credit card mock forms inside payment panel
    const paymentContainer = document.getElementById("payment-form-container");
    paymentContainer.innerHTML = `
      <div style="background-color: var(--primary-light); padding:16px 20px; border-radius:var(--radius-md); margin-bottom:20px; font-size:14px; color:var(--primary); font-weight:500; display:flex; align-items:center; gap:10px;">
        <i data-lucide="lock" style="width:16px; height:16px;"></i> Secure Sandbox Mock Payment Gateway
      </div>
      <p style="font-size:14px; margin-bottom:16px; color:var(--text-muted);">
        Enter card details below to complete your payment of <strong>₹${amount.toLocaleString("en-IN")}</strong>.
      </p>

      <form id="checkout-payment-form">
        <div class="form-group">
          <label for="card-holder">Cardholder Name</label>
          <input type="text" id="card-holder" class="form-control" placeholder="John Doe" required>
        </div>
        
        <div class="form-group">
          <label for="card-number">Card Number</label>
          <input type="text" id="card-number" class="form-control" placeholder="4242 4242 4242 4242" maxlength="19" required>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="card-expiry">Expiry Date</label>
            <input type="text" id="card-expiry" class="form-control" placeholder="MM/YY" maxlength="5" required>
          </div>
          <div class="form-group">
            <label for="card-cvv">CVV</label>
            <input type="password" id="card-cvv" class="form-control" placeholder="123" maxlength="3" required>
          </div>
        </div>

        <button type="submit" id="btn-submit-payment" class="btn btn-primary" style="width:100%; padding:14px 0; margin-top:10px;">
          Pay ₹${amount.toLocaleString("en-IN")} & Confirm Order
        </button>
      </form>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Handle Card Formatting
    const cardInput = document.getElementById("card-number");
    cardInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
      let matches = v.match(/\d{4,16}/g);
      let match = matches && matches[0] || "";
      let parts = [];
      for (let i=0, len=match.length; i<len; i+=4) {
        parts.push(match.substring(i, i+4));
      }
      if (parts.length > 0) {
        e.target.value = parts.join(" ");
      } else {
        e.target.value = v;
      }
    });

    const expiryInput = document.getElementById("card-expiry");
    expiryInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
      if (v.length >= 2) {
        e.target.value = v.substring(0, 2) + "/" + v.substring(2, 4);
      } else {
        e.target.value = v;
      }
    });

    // Handle Payment Submission
    const payForm = document.getElementById("checkout-payment-form");
    payForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const payBtn = document.getElementById("btn-submit-payment");
      payBtn.disabled = true;
      payBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 14px; height: 14px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Validating Card...`;
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        showToast("Payment authentication authorized. Order created!", "success");
        window.location.hash = `#/orders/${orderId}`;
      }, 2000);
    });
  }

  function showAddAddressModal() {
    const modalHTML = `
      <div class="modal-header">
        <h3 style="font-size:20px;">Add New Shipping Address</h3>
        <button data-modal-close style="color:var(--text-light);"><i data-lucide="x"></i></button>
      </div>
      <form id="modal-address-form">
        <div class="form-group">
          <label for="modal-street1">Street Line 1</label>
          <input type="text" id="modal-street1" class="form-control" placeholder="123 Main St, Apartment 4B" required>
        </div>
        <div class="form-group">
          <label for="modal-street2">Street Line 2 (Optional)</label>
          <input type="text" id="modal-street2" class="form-control" placeholder="Suite, Landmark, Near...">
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="modal-city">City</label>
            <input type="text" id="modal-city" class="form-control" placeholder="New Delhi" required>
          </div>
          <div class="form-group">
            <label for="modal-state">State / Region</label>
            <input type="text" id="modal-state" class="form-control" placeholder="Delhi" required>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="modal-postal">Postal / ZIP Code</label>
            <input type="text" id="modal-postal" class="form-control" placeholder="110001" required>
          </div>
          <div class="form-group">
            <label for="modal-country">Country</label>
            <input type="text" id="modal-country" class="form-control" placeholder="India" required>
          </div>
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" id="btn-modal-save-addr" class="btn btn-primary">Save Address</button>
        </div>
      </form>
    `;

    showModal(modalHTML, (modalBody) => {
      const addrForm = modalBody.querySelector("#modal-address-form");
      addrForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const saveBtn = document.getElementById("btn-modal-save-addr");
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 14px; height: 14px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Saving...`;
        if (window.lucide) window.lucide.createIcons();

        const s1 = document.getElementById("modal-street1").value.trim();
        const s2 = document.getElementById("modal-street2").value.trim() || null;
        const city = document.getElementById("modal-city").value.trim();
        const state = document.getElementById("modal-state").value.trim();
        const zip = document.getElementById("modal-postal").value.trim();
        const country = document.getElementById("modal-country").value.trim();

        try {
          await API.addresses.addAddress(s1, s2, city, state, zip, country, addresses.length === 0);
          showToast("Address added successfully.", "success");
          hideModal();
          
          // Refresh checkout state
          await renderCheckout(container);
        } catch (err) {
          showToast(err.message || "Failed to save address.", "error");
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Address";
          if (window.lucide) window.lucide.createIcons();
        }
      });
    });
  }

  // Render initial layout
  renderLayout();
}
