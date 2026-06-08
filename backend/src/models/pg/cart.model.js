const { query } = require("../../config/db.pg");

const CartModel = {
  // Get ot Create the cart
  async getOrCreate(userId) {
    const sql = `SELECT * FROM carts WHERE user_id = $1`;
    let { rows } = await query(sql, [userId]);

    if (rows.length === 0) {
      const sql = `INSERT INTO carts (user_id) VALUES ($1) RETURNING *;`;
      const result = await query(sql, [userId]);
      rows = result.rows;
    }

    return rows[0];
  },

  // Get cart items
  async getCartItems(cartId) {
    const sql = `SELECT * FROM cart_items WHERE cart_id = $1;`;

    const { rows } = await query(sql, [cartId]);

    return rows;
  },

  // Add a cart item
  async addItem({ cartId, productId, sku, quantity }) {
    const sql = `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND sku = $2;`;
    const result = await query(sql, [cartId, sku]);

    if (result.rows.length > 0) {
      const newQty = result.rows[0].quantity + quantity;
      const sql = `UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *;`;

      const { rows } = await query(sql, [newQty, result.rows[0].id]);

      return rows[0];
    } else {
      const sql = `
        INSERT INTO cart_items (cart_id, product_id, sku, quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING *;`;

      const { rows } = await query(sql, [cartId, productId, sku, quantity]);

      return rows[0];
    }
  },

  // Update item quantity
  async updateItemQuantity(cartId, itemId, quantity) {
    const sql = `UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3 RETURNING *;`;

    const { rows } = await query(sql, [quantity, itemId, cartId]);

    return rows[0];
  },

  // Remove the item
  async removeItem(cartId, itemId) {
    const sql = `DELETE FROM cart_items WHERE id = $1 AND cart_id = $2 RETURNING *;`;

    const { rows } = await query(sql, [itemId, cartId]);

    return rows[0];
  },

  // Clear All
  async clear(cartId) {
    const sql = `DELETE FROM cart_items WHERE cart_id = $1;`;
    await query(sql, [cartId]);
  },
};

module.exports = { CartModel };
