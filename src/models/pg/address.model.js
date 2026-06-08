const { query } = require("../../config/db.pg");

const AddressModel = {
  // Create address
  async create({
    userId,
    streetLine1,
    streetLine2 = null,
    city,
    state,
    postalCode,
    country,
    isDefault = false,
  }) {
    if (isDefault) {
      await query(
        `UPDATE addresses SET is_default = false WHERE user_id = $1`,
        [userId],
      );
    }

    const sql = `
      INSERT INTO addresses (user_id, street_line1, street_line2, city, state, postal_code, country, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`;

    const { rows } = await query(sql, [
      userId,
      streetLine1,
      streetLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    ]);

    return rows[0];
  },

  // Find the address by userId
  async findByUserId(userId) {
    const sql = `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id ASC;`;

    const { rows } = await query(sql, [userId]);

    return rows;
  },

  // Find by id
  async findById(id, userId) {
    const sql = `SELECT * FROM addresses WHERE id = $1 AND user_id = $2;`;

    const { rows } = await query(sql, [id, userId]);

    return rows[0];
  },

  // Delete user addresses
  async delete(id, userId) {
    const sql = `DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id;`;

    const { rows } = await query(sql, [id, userId]);

    return rows[0];
  },
};

module.exports = { AddressModel };
