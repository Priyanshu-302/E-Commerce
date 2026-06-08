/* ==========================================================================
   SwiftCart Orders History & Details Page Module
   ========================================================================== */

import { API } from "../api.js";
import { state, showToast } from "../app.js";

export async function renderOrders(container, orderId = null) {
  // 1. Guard check
  if (!state.user) {
    window.location.hash = "#/auth";
    return;
  }

  if (orderId) {
    // Render Order Details View
    await renderOrderDetails(container, orderId);
  } else {
    // Render Orders List View
    await renderOrdersList(container);
  }
}

/**
 * List all orders for the current user.
 */
async function renderOrdersList(container) {
  let orders = [];
  let fetchError = null;

  try {
    const data = await API.orders.getOrders();
    orders = data.orders || [];
  } catch (err) {
    fetchError = err.message;
  }

  if (fetchError) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color:var(--error);">
        <i data-lucide="alert-triangle" style="width:40px; height:40px; margin-bottom:12px;"></i>
        <p>Failed to load orders: ${fetchError}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 20px;">
        <i data-lucide="package" style="width:56px; height:56px; color:var(--text-light); margin-bottom:16px;"></i>
        <h3 style="font-size:24px; margin-bottom:12px;">No orders yet</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">You haven't placed any orders on SwiftCart yet.</p>
        <a href="#/products" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div style="margin-top: 20px;">
      <h2 style="font-size:28px; margin-bottom:24px;">Your Orders</h2>
      
      <div class="orders-list">
        ${orders.map(order => {
          const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
          const shortId = order.id.substring(0, 8);
          const statusClass = getStatusClass(order.status);

          return `
            <div class="order-row-card" onclick="window.location.hash = '#/orders/${order.id}'">
              <div class="order-meta">
                <h4>Order #${shortId}...</h4>
                <p>${dateStr}</p>
              </div>
              
              <div style="display:flex; align-items:center; gap:20px;">
                <span style="font-family: var(--font-heading); font-weight:700;">
                  ₹${parseFloat(order.total_amount).toLocaleString("en-IN")}
                </span>
                
                <span class="order-status ${statusClass}">
                  ${order.status.replace("_", " ")}
                </span>
                
                <i data-lucide="chevron-right" style="color:var(--text-light); width:18px; height:18px;"></i>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Display details of a single order.
 */
async function renderOrderDetails(container, orderId) {
  let order = null;
  let fetchError = null;

  try {
    const data = await API.orders.getOrderDetails(orderId);
    order = data.order;
  } catch (err) {
    fetchError = err.message;
  }

  if (fetchError || !order) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <i data-lucide="alert-circle" style="width:40px; height:40px; color:var(--error); margin-bottom:12px;"></i>
        <h3 style="font-size:20px; margin-bottom:12px;">Order not found</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">${fetchError || "The requested order details could not be retrieved."}</p>
        <a href="#/orders" class="btn btn-primary">Back to Orders</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const address = order.shipping_address;
  const statusClass = getStatusClass(order.status);
  
  // Calculate pricing breakdown
  const total = parseFloat(order.total_amount);
  const subtotal = order.items.reduce((acc, item) => acc + (parseFloat(item.unit_price) * item.quantity), 0);
  const shipping = subtotal >= 5000 ? 0 : 150;
  const tax = total - subtotal - shipping;

  container.innerHTML = `
    <div style="margin-top: 20px;">
      <!-- Breadcrumb -->
      <p style="font-size: 13px; color: var(--text-light); margin-bottom: 24px;">
        <a href="#/">Home</a> / <a href="#/orders">Orders</a> / <span style="color: var(--text-main);">#${order.id.substring(0,8)}</span>
      </p>

      <div class="order-detail-header">
        <div>
          <h2 style="font-size:26px; margin-bottom:6px;">Order Details</h2>
          <p style="color:var(--text-muted); font-size:14px;">Placed on ${dateStr} | Order ID: ${order.id}</p>
        </div>
        <span class="order-status ${statusClass}" id="detail-status-badge" style="font-size:14px; padding: 8px 16px;">
          ${order.status.replace("_", " ")}
        </span>
      </div>

      <!-- Developer Payment Simulator Banner -->
      ${order.status === "pending_payment" ? `
        <div class="sim-banner" id="payment-simulator-banner">
          <div>
            <h4 style="color: var(--primary); font-size: 15px; font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
              <i data-lucide="wrench" style="width:16px; height:16px;"></i> Sandbox Dev Payment Simulator
            </h4>
            <p style="font-size:13px; color:var(--text-muted)">
              This order is awaiting payment confirmation. Trigger a mock Stripe webhook event to mark it paid.
            </p>
          </div>
          <button id="btn-simulate-payment" class="btn btn-primary" style="font-size:13px; padding: 10px 18px; white-space:nowrap; background-color:var(--accent); color:#000;">
            Trigger Paid Webhook
          </button>
        </div>
      ` : ""}

      <!-- Two Column Detail Grid -->
      <div style="display:grid; grid-template-columns: 1.8fr 1.2fr; gap:40px;">
        <!-- Left Column: Items and Shipping -->
        <div>
          <!-- Order Items -->
          <h3 style="font-size:18px; margin-bottom:16px;">Items Purchased</h3>
          <div class="order-items-list">
            ${order.items.map(item => `
              <div class="order-item-row">
                <div>
                  <h4 style="font-size:15px; font-weight:600; margin-bottom:4px;">${item.name}</h4>
                  <p style="font-size:12px; color:var(--text-light)">SKU: ${item.sku}</p>
                </div>
                <div style="text-align:right;">
                  <p style="font-weight:600; font-size:14px;">₹${parseFloat(item.unit_price).toLocaleString("en-IN")}</p>
                  <p style="font-size:12px; color:var(--text-muted)">Qty: ${item.quantity}</p>
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Shipping Address info -->
          <h3 style="font-size:18px; margin-bottom:16px;">Shipping Details</h3>
          <div style="background-color:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:24px;">
            <h5 style="font-size:14px; margin-bottom:8px; font-weight:600;">Delivery Address</h5>
            <p style="font-size:14px; font-weight:500; margin-bottom:4px; color:var(--text-main);">${address.streetLine1}</p>
            ${address.streetLine2 ? `<p style="font-size:14px; margin-bottom:4px;">${address.streetLine2}</p>` : ""}
            <p style="font-size:14px; color:var(--text-muted);">${address.city}, ${address.state} - ${address.postalCode}</p>
            <p style="font-size:13px; color:var(--primary); font-weight:600; margin-top:10px;">${address.country}</p>
          </div>
        </div>

        <!-- Right Column: Payment & Price Summary -->
        <div class="cart-summary" style="align-self: flex-start;">
          <h3 class="summary-title" style="font-size:18px;">Payment Summary</h3>
          
          <div class="summary-row" style="font-size:13px;">
            <span>Subtotal</span>
            <span>₹${subtotal.toLocaleString("en-IN")}</span>
          </div>

          <div class="summary-row" style="font-size:13px;">
            <span>Shipping & Handling</span>
            <span>${shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
          </div>

          <div class="summary-row" style="font-size:13px;">
            <span>Taxes (GST 18%)</span>
            <span>₹${tax.toLocaleString("en-IN")}</span>
          </div>

          <div class="summary-row total" style="font-size:16px; margin-bottom:0;">
            <span>Total Amount Paid</span>
            <span>₹${total.toLocaleString("en-IN")}</span>
          </div>
          
          ${order.stripe_payment_id ? `
            <p style="font-size:11px; color:var(--text-light); margin-top:20px; word-break:break-all;">
              Transaction ID: <strong>${order.stripe_payment_id}</strong>
            </p>
          ` : ""}
        </div>
      </div>
    </div>
  `;

  // Attach simulator click handler
  const simBtn = document.getElementById("btn-simulate-payment");
  if (simBtn) {
    simBtn.addEventListener("click", async () => {
      try {
        simBtn.disabled = true;
        simBtn.innerHTML = `<i data-lucide="loader-2" class="spinner" style="width: 14px; height: 14px; animation: spin 1s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Triggering Webhook...`;
        if (window.lucide) window.lucide.createIcons();

        const response = await API.orders.simulatePayment(orderId);
        showToast("Payment Webhook Succeeded! Email receipt generated.", "success");
        
        // Remove simulator and update badge
        const banner = document.getElementById("payment-simulator-banner");
        if (banner) banner.remove();

        const badge = document.getElementById("detail-status-badge");
        if (badge) {
          badge.className = "order-status status-paid";
          badge.textContent = "Paid";
        }
        
        // Re-render the layout after a small delay
        setTimeout(() => renderOrderDetails(container, orderId), 1500);
      } catch (err) {
        showToast(err.message || "Simulation failed.", "error");
        simBtn.disabled = false;
        simBtn.textContent = "Trigger Paid Webhook";
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function getStatusClass(status) {
  if (status === "paid") return "status-paid";
  if (status === "pending_payment") return "status-pending";
  return "status-failed";
}
