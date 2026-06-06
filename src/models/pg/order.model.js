const { pool } = require("../../config/db.pg.js");

const OrderModel = {
  // Create Order
  async createOrder({ userId, totalAmount, shippingAddress, items }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN"); // Transaction starts

      for (const item of items) {
        const lockStock = `SELECT stock_quantity FROM inventories where sku = $1 FOR UPDATE`;
        const stockRes = await pool.query(lockStock, [item.sku]);
        const currentStock = stockRes.rows[0]
          ? stockRes.rows[0].stock_quantity
          : 0;

        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for SKU: ${item.sku}. Available: ${currentStock}`,
          );
        }

        const deductStockSql = `UPDATE inventories SET stock_quantity = stock_quantity - $1 WHERE sku = $2`;
        await pool.query(deductStockSql, [item.quantity, item.sku]);
      }

      const orderSql = `
        INSERT INTO orders (user_id, total_amount, shipping_address, status)
        VALUES ($1, $2, $3, 'pending_payment')
        RETURNING *;`;

      const orderRes = await pool.query(orderSql, [
        userId,
        totalAmount,
        JSON.stringify(shippingAddress),
      ]);

      const newOrder = orderRes.rows[0];

      const insertItemSql = `
        INSERT INTO order_items (order_id, product_id, sku, name, quantity, unit_price)
        VALUES ($1, $2, $3, $4, $5, $6);`;

      for (const item of items) {
        const itemValues = [
          newOrder.id,
          item.productId,
          item.sku,
          item.name,
          item.quantity,
          item.unit_price,
        ];

        await pool.query(insertItemSql, itemValues);
      }

      await client.query("COMMIT"); // Transaction commits
      return newOrder;
    } catch (error) {
      await client.query("ROLLBACK"); // Transaction rolls back
      throw error;
    } finally {
      client.release();
    }
  },

  // Find by orderId
  async findById(orderId) {
    const orderSql = `SELECT * FROM orders WHERE id = $1;`;
    const itemSql = `SELECT * FROM order_items WHERE order_id = $1;`;

    const { rows: orderRows } = await pool.query(orderSql, [orderId]);

    if (orderRows.length === 0) return null;
    const { rows: itemRows } = await pool.query(itemsSql, [orderId]);

    return {
      ...orderRows[0],
      items: itemRows,
    };
  },

  // Find by user id
  async findByUserId(userId) {
    const sql = `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC;`;

    const { rows } = await pool.query(sql, [userId]);

    return rows;
  },

  // Update status
  async updateStatus(orderId, status, stripePaymentId = null) {
    const sql = `
      UPDATE orders 
      SET status = $1, stripe_payment_id = COALESCE($2, stripe_payment_id), updated_at = NOW() 
      WHERE id = $3 
      RETURNING *;`;

    const { rows } = await pool.query(sql, [status, stripePaymentId, orderId]);

    return rows[0];
  },
};

module.exports = { OrderModel };
