/* ==========================================================================
   SwiftCart API Client Module
   ========================================================================== */

const BASE_URL = "http://localhost:5000/api/v1";

let accessToken = null;
let userState = null;
let onAuthChangeCallback = null;

export const setOnAuthChange = (callback) => {
  onAuthChangeCallback = callback;
};

const triggerAuthChange = (user) => {
  userState = user;
  if (onAuthChangeCallback) {
    onAuthChangeCallback(user);
  }
};

export const getAccessToken = () => accessToken;
export const getCurrentUser = () => userState;

/**
 * Base fetch wrapper with auth header injection and automatic token refresh.
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set default headers
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  // Attach access token if present
  if (accessToken) {
    options.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  // Always include credentials (cookies) for refresh token endpoint
  options.credentials = "include";

  try {
    let response = await fetch(url, options);
    
    // If unauthorized, token might have expired. Try to refresh.
    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      console.warn("Access token expired or missing. Attempting refresh...");
      const refreshSuccess = await refreshSession();
      
      if (refreshSuccess) {
        // Retry original request with the new token
        options.headers["Authorization"] = `Bearer ${accessToken}`;
        response = await fetch(url, options);
      } else {
        // If refresh fails, clear auth state
        accessToken = null;
        triggerAuthChange(null);
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Attempt to refresh the access token using HTTP-only cookies.
 */
async function refreshSession() {
  try {
    const url = `${BASE_URL}/auth/refresh`;
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
    });
    
    if (response.ok) {
      const data = await response.json();
      accessToken = data.accessToken;
      // Decode JWT to get user state details or fetch user profile.
      // For simplicity, we can fetch user profile or decode the JWT.
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      triggerAuthChange({
        id: payload.id,
        role: payload.role,
        // Name and email will be updated once they login or reload
        firstName: userState?.firstName || "Customer",
        lastName: userState?.lastName || "",
        email: userState?.email || "",
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Refresh session failed:", err);
    return false;
  }
}

/* API Endpoints Export */
export const API = {
  // Authentication
  auth: {
    async register(email, password, firstName, lastName, phone) {
      return await fetchAPI("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      });
    },

    async login(email, password) {
      const data = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      accessToken = data.accessToken;
      triggerAuthChange(data.user);
      return data;
    },

    async refresh() {
      return await refreshSession();
    },

    async logout() {
      try {
        await fetchAPI("/auth/logout", { method: "POST" });
      } catch (e) {
        console.warn("Logout request failed, cleaning local state anyway.");
      }
      accessToken = null;
      triggerAuthChange(null);
    }
  },

  // Catalog / Products
  products: {
    async getProducts({ category, brand, minPrice, maxPrice, search, page = 1, limit = 12 }) {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (brand) params.append("brand", brand);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (search) params.append("search", search);
      params.append("page", page);
      params.append("limit", limit);

      return await fetchAPI(`/products?${params.toString()}`);
    },

    async getProductBySlug(slug) {
      return await fetchAPI(`/products/${slug}`);
    },

    async getCategories() {
      return await fetchAPI("/products/categories");
    },

    async getStock(sku) {
      return await fetchAPI(`/products/stock/${sku}`);
    }
  },

  // Cart Management
  cart: {
    async getCart() {
      return await fetchAPI("/cart");
    },

    async addItem(productId, sku, quantity = 1) {
      return await fetchAPI("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, sku, quantity }),
      });
    },

    async updateItem(itemId, quantity, sku) {
      return await fetchAPI(`/cart/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity, sku }),
      });
    },

    async removeItem(itemId) {
      return await fetchAPI(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
    }
  },

  // User Addresses
  addresses: {
    async getAddresses() {
      return await fetchAPI("/addresses");
    },

    async addAddress(streetLine1, streetLine2, city, state, postalCode, country, isDefault = false) {
      return await fetchAPI("/addresses", {
        method: "POST",
        body: JSON.stringify({ streetLine1, streetLine2, city, state, postalCode, country, isDefault }),
      });
    }
  },

  // Orders Checkout & History
  orders: {
    async checkout(addressId) {
      return await fetchAPI("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({ addressId }),
      });
    },

    async getOrders() {
      return await fetchAPI("/orders/my-orders");
    },

    async getOrderDetails(orderId) {
      return await fetchAPI(`/orders/${orderId}`);
    },

    async simulatePayment(orderId) {
      return await fetchAPI(`/orders/${orderId}/simulate-payment`, {
        method: "POST",
      });
    }
  }
};
