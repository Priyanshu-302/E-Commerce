const { query } = require("../../config/db.pg");

const UserModel = {
  // Create the user
  async create({
    email,
    passwordHash,
    firstName,
    lastName,
    phone = null,
    role = "customer",
  }) {
    const sql = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, created_at;
    `;

    const { rows } = await query(sql, [
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role,
    ]);

    return rows[0];
  },

  // Find user by email
  async findByEmail(email) {
    const sql = `SELECT * from users WHERE email = $1`;

    const { rows } = await query(sql, [email]);

    return rows[0];
  },

  // Find user by id
  async findById(id) {
    const sql = `SELECT id, email, first_name, last_name, phone, role, created_at from users where id = $1`;

    const { rows } = await query(sql, [id]);

    return rows[0];
  },
};

module.exports = { UserModel };
