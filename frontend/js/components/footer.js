/* ==========================================================================
   SwiftCart Footer Component
   ========================================================================== */

export function renderFooter() {
  const footer = document.getElementById("main-footer");
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Brand Col -->
        <div class="footer-col">
          <h4 style="font-family: var(--font-heading); color: var(--primary); font-size: 20px; font-weight: 800; margin-bottom: 15px;">
            Swift<span>Cart</span>
          </h4>
          <p>SwiftCart is your destination for premium quality lifestyle goods. Experience lightning fast checkout, handpicked products, and world-class support.</p>
          <div class="social-links">
            <a href="#" class="social-btn"><i data-lucide="facebook"></i></a>
            <a href="#" class="social-btn"><i data-lucide="twitter"></i></a>
            <a href="#" class="social-btn"><i data-lucide="instagram"></i></a>
            <a href="#" class="social-btn"><i data-lucide="linkedin"></i></a>
          </div>
        </div>

        <!-- Shop Col -->
        <div class="footer-col">
          <h4>Shop Catalog</h4>
          <ul>
            <li><a href="#/products?category=Electronics">Electronics</a></li>
            <li><a href="#/products?category=Footwear">Footwear</a></li>
            <li><a href="#/products?category=Apparel">Apparel</a></li>
            <li><a href="#/products?category=Home+%26+Living">Home & Living</a></li>
          </ul>
        </div>

        <!-- Links Col -->
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#/orders">My Orders</a></li>
            <li><a href="#/cart">Shopping Cart</a></li>
            <li><a href="#/">Home Page</a></li>
            <li><a href="#/auth">Login / Register</a></li>
          </ul>
        </div>

        <!-- Contact Col -->
        <div class="footer-col">
          <h4>Contact Us</h4>
          <p style="margin-bottom: 8px;"><i data-lucide="map-pin" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> 101 E-Commerce Plaza, Silicon Valley, CA</p>
          <p style="margin-bottom: 8px;"><i data-lucide="phone" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> +1 (800) SWIFT-CART</p>
          <p style="margin-bottom: 8px;"><i data-lucide="mail" style="width: 14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> support@swiftcart.com</p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} SwiftCart Inc. All rights reserved.</p>
        <div class="payment-methods">
          <i data-lucide="credit-card" title="Visa / Mastercard"></i>
          <span style="font-size:12px; font-weight:600; padding:2px 8px; border:1px solid var(--border-color); border-radius:4px;">Stripe Secured</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
