const { query } = require("../../config/db.pg");

const TokenModel = {
  // Save the token
  async save({ userId, token, expiresAt }) {
    const sql = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

    const { rows } = await query(sql, [userId, token, expiresAt]);

    return rows[0];
  },

  // Find the token
  async find(token) {
    const sql = `SELECT * FROM refresh_tokens WHERE token = $1`;

    const { rows } = await query(sql, [token]);

    return rows[0];
  },

  // Delete a single token
  async delete(token) {
    const sql = `DELETE FROM refresh_tokens WHERE token = $1 RETURNING *`;

    const { rows } = await query(sql, [token]);

    return rows[0];
  },

  // Delete for all users
  async deleteForAll(userId) {
    const sql = `DELETE FROM refresh_tokens WHERE user_id = $1`;
    await query(sql, [userId]);
  },
};

module.exports = { TokenModel };
