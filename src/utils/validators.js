const { z } = require("zod");

// Schema for registration input validation
const registerSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().optional().nullable(),
});

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(1, "Password is required."),
});

// Schema for user addresses input validation
const addressSchema = z.object({
  streetLine1: z.string().min(1, "Street address is required."),
  streetLine2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State / Region is required."),
  postalCode: z.string().min(1, "Postal / ZIP code is required."),
  country: z.string().min(1, "Country is required."),
  isDefault: z.boolean().optional().default(false),
});

module.exports = {
  registerSchema,
  loginSchema,
  addressSchema,
};
