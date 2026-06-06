const { query } = require("../../config/db.pg");

const InventoryModel = {
  // Get Stock
  async geStock(sku) {
    const sql = `SELECT stock_quantity FROM inventories WHERE sku = $1;`;

    const { rows } = await query(sql, [sku]);

    return rows[0] ? rows[0].stock_quantity : 0;
  },

  // Update Stock Quantity
  async updateStock(sku, quantity) {
    const sql = `
      INSERT INTO inventories (sku, stock_quantity)
      VALUES ($1, $2)
      ON CONFLICT (sku) 
      DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity, updated_at = NOW()
      RETURNING *;
    `;

    const { rows } = await query(sql, [sku, quantity]);

    return rows[0];
  },
};

module.exports = { InventoryModel };