const mongoose = require("mongoose");
require("dotenv").config();

const { connectDB } = require("./src/config/db.mongo");
const { query, pool } = require("./src/config/db.pg");
const Product = require("./src/models/mongodb/product.model");
const Category = require("./src/models/mongodb/category.model");

const categoriesData = [
  { name: "Electronics", description: "Laptops, headphones, smartphones and smart gadgets." },
  { name: "Footwear", description: "Premium running shoes, sneakers, and formal footwear." },
  { name: "Apparel", description: "Trendy hoodies, jackets, shirts and sports wear." },
  { name: "Home & Living", description: "Modern furniture, decor, and workspace accessories." },
];

const productsData = (categoryIds) => [
  // Footwear
  {
    title: "Swift-Run Pro Sneakers",
    description: "Designed for ultimate performance and comfort. Features a breathable knit upper, responsive foam cushioning, and a durable rubber outsole. Perfect for daily running or casual streetwear.",
    brand: "Aeros",
    categories: categoryIds["Footwear"],
    base_price: 5499,
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", is_primary: true },
      { url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80", is_primary: false },
    ],
    attributes: [
      { name: "Material", value: "Mesh / Rubber" },
      { name: "Type", value: "Running" }
    ],
    variants: [
      { sku: "SWIFT-RUN-RED-9", price: 5499, attributes: [{ name: "Color", value: "Red" }, { name: "Size", value: "9" }] },
      { sku: "SWIFT-RUN-RED-10", price: 5499, attributes: [{ name: "Color", value: "Red" }, { name: "Size", value: "10" }] },
      { sku: "SWIFT-RUN-BLK-9", price: 5499, attributes: [{ name: "Color", value: "Black" }, { name: "Size", value: "9" }] },
      { sku: "SWIFT-RUN-BLK-10", price: 5699, attributes: [{ name: "Color", value: "Black" }, { name: "Size", value: "10" }] },
    ],
    ratings: { average_rating: 4.6, total_reviews: 124 },
    is_published: true,
  },
  {
    title: "Classic Urban Leather Boots",
    description: "Handcrafted from premium full-grain leather. Built to last with a water-resistant finish, reinforced stitching, and a cushioned ortholite insole for all-day comfort.",
    brand: "TimberCraft",
    categories: categoryIds["Footwear"],
    base_price: 8999,
    images: [
      { url: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80", is_primary: true },
    ],
    attributes: [
      { name: "Material", value: "Full-Grain Leather" },
      { name: "Style", value: "Ankle Boot" }
    ],
    variants: [
      { sku: "BOOTS-BRN-9", price: 8999, attributes: [{ name: "Color", value: "Brown" }, { name: "Size", value: "9" }] },
      { sku: "BOOTS-BRN-10", price: 8999, attributes: [{ name: "Color", value: "Brown" }, { name: "Size", value: "10" }] },
      { sku: "BOOTS-BLK-10", price: 9299, attributes: [{ name: "Color", value: "Black" }, { name: "Size", value: "10" }] },
    ],
    ratings: { average_rating: 4.8, total_reviews: 48 },
    is_published: true,
  },
  // Electronics
  {
    title: "Apex ANC Wireless Headphones",
    description: "Immerse yourself in pure sound. Experience industry-leading Active Noise Cancellation (ANC), 40 hours of battery life, fast charging, and plush memory foam earcups for ultimate long-session comfort.",
    brand: "SonicX",
    categories: categoryIds["Electronics"],
    base_price: 12999,
    images: [
      { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", is_primary: true },
      { url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80", is_primary: false },
    ],
    attributes: [
      { name: "Connectivity", value: "Bluetooth 5.2 / AUX" },
      { name: "Battery Life", value: "Up to 40 Hours" }
    ],
    variants: [
      { sku: "APEX-ANC-BLK", price: 12999, attributes: [{ name: "Color", value: "Matte Black" }] },
      { sku: "APEX-ANC-WHT", price: 12999, attributes: [{ name: "Color", value: "Platinum White" }] },
      { sku: "APEX-ANC-BLU", price: 13499, attributes: [{ name: "Color", value: "Midnight Blue" }] },
    ],
    ratings: { average_rating: 4.7, total_reviews: 350 },
    is_published: true,
  },
  {
    title: "Quantum Smart Watch Pro",
    description: "The ultimate health and activity companion. Features an always-on AMOLED display, built-in GPS, heart rate monitor, SpO2 sensor, sleep tracking, and up to 10 days of battery life.",
    brand: "Chronos",
    categories: categoryIds["Electronics"],
    base_price: 6499,
    images: [
      { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", is_primary: true },
    ],
    attributes: [
      { name: "Water Resistance", value: "5ATM" },
      { name: "Compatibility", value: "iOS / Android" }
    ],
    variants: [
      { sku: "QUANTUM-WATCH-SILVER", price: 6499, attributes: [{ name: "Color", value: "Silver" }] },
      { sku: "QUANTUM-WATCH-GOLD", price: 7499, attributes: [{ name: "Color", value: "Rose Gold" }] },
    ],
    ratings: { average_rating: 4.4, total_reviews: 95 },
    is_published: true,
  },
  // Apparel
  {
    title: "Nomad Streetwear Hoodie",
    description: "Ultra-soft heavyweight fleece hoodie designed for maximum comfort and style. Relaxed unisex fit, double-lined hood, and a spacious front kangaroo pocket. Perfect for layering in colder weather.",
    brand: "SwiftThreads",
    categories: categoryIds["Apparel"],
    base_price: 2499,
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80", is_primary: true },
    ],
    attributes: [
      { name: "Material", value: "80% Cotton / 20% Polyester" },
      { name: "Weight", value: "350 GSM" }
    ],
    variants: [
      { sku: "NOMAD-HD-GRY-M", price: 2499, attributes: [{ name: "Color", value: "Heather Grey" }, { name: "Size", value: "M" }] },
      { sku: "NOMAD-HD-GRY-L", price: 2499, attributes: [{ name: "Color", value: "Heather Grey" }, { name: "Size", value: "L" }] },
      { sku: "NOMAD-HD-BLK-M", price: 2499, attributes: [{ name: "Color", value: "Charcoal Black" }, { name: "Size", value: "M" }] },
      { sku: "NOMAD-HD-BLK-L", price: 2499, attributes: [{ name: "Color", value: "Charcoal Black" }, { name: "Size", value: "L" }] },
    ],
    ratings: { average_rating: 4.5, total_reviews: 82 },
    is_published: true,
  },
  {
    title: "Air-Flow Tech Training Tee",
    description: "Stay cool and dry during intense workouts. Made with lightweight sweat-wicking fabric and flatlock seams to prevent chafing. Breathable side mesh panels maximize ventilation.",
    brand: "Aeros",
    categories: categoryIds["Apparel"],
    base_price: 1299,
    images: [
      { url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80", is_primary: true },
    ],
    attributes: [
      { name: "Material", value: "100% Recycled Polyester" },
      { name: "Technology", value: "Dry-Fit Tech" }
    ],
    variants: [
      { sku: "TECH-TEE-BLU-S", price: 1299, attributes: [{ name: "Color", value: "Electric Blue" }, { name: "Size", value: "S" }] },
      { sku: "TECH-TEE-BLU-M", price: 1299, attributes: [{ name: "Color", value: "Electric Blue" }, { name: "Size", value: "M" }] },
      { sku: "TECH-TEE-BLU-L", price: 1299, attributes: [{ name: "Color", value: "Electric Blue" }, { name: "Size", value: "L" }] },
      { sku: "TECH-TEE-GRY-M", price: 1299, attributes: [{ name: "Color", value: "Steel Grey" }, { name: "Size", value: "M" }] },
    ],
    ratings: { average_rating: 4.3, total_reviews: 41 },
    is_published: true,
  },
  // Home & Living
  {
    title: "Minimalist Oak Desk Organizer",
    description: "De-clutter your workspace in style. Meticulously carved from sustainable solid oak wood. Features dedicated slots for your smartphone, pens, keys, and a tray for small daily items.",
    brand: "TimberCraft",
    categories: categoryIds["Home & Living"],
    base_price: 1999,
    images: [
      { url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80", is_primary: true },
    ],
    attributes: [
      { name: "Wood Type", value: "Solid Oak" },
      { name: "Finish", value: "Natural Beeswax" }
    ],
    variants: [
      { sku: "DESK-ORG-OAK", price: 1999, attributes: [{ name: "Wood", value: "Oak" }] },
      { sku: "DESK-ORG-WALNUT", price: 2499, attributes: [{ name: "Wood", value: "Walnut" }] },
    ],
    ratings: { average_rating: 4.9, total_reviews: 30 },
    is_published: true,
  },
  {
    title: "Double-Walled Smart Thermal Flask",
    description: "Keep your drinks hot for 12 hours or ice-cold for 24 hours. Features a smart LED touch temperature display cap, medical-grade stainless steel body, and a leak-proof BPA-free design.",
    brand: "Chronos",
    categories: categoryIds["Home & Living"],
    base_price: 1499,
    images: [
      { url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80", is_primary: true },
    ],
    attributes: [
      { name: "Material", value: "316 Stainless Steel" },
      { name: "Capacity", value: "500 ml" }
    ],
    variants: [
      { sku: "FLASK-SMART-BLK", price: 1499, attributes: [{ name: "Color", value: "Stealth Black" }] },
      { sku: "FLASK-SMART-SLV", price: 1499, attributes: [{ name: "Color", value: "Brushed Silver" }] },
    ],
    ratings: { average_rating: 4.5, total_reviews: 156 },
    is_published: true,
  }
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to databases...");
    await connectDB();
    console.log("MongoDB Connected.");
    
    // Clear MongoDB
    console.log("Cleaning MongoDB Collections...");
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log("MongoDB Collections Cleared.");

    // Clear PostgreSQL tables (in correct order of dependencies)
    console.log("Cleaning PostgreSQL Tables...");
    await query("DELETE FROM order_items;");
    await query("DELETE FROM orders;");
    await query("DELETE FROM cart_items;");
    await query("DELETE FROM carts;");
    await query("DELETE FROM addresses;");
    await query("DELETE FROM refresh_tokens;");
    await query("DELETE FROM inventories;");
    // We don't delete users so user accounts are preserved, or we can clear them too. Let's delete users for a fresh start.
    await query("DELETE FROM users;");
    console.log("PostgreSQL Tables Cleared.");

    // Seed Categories
    console.log("Seeding Categories into MongoDB...");
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${createdCategories.length} Categories.`);

    // Map Categories by Name to ObjectIds
    const categoryIds = {};
    createdCategories.forEach(cat => {
      categoryIds[cat.name] = cat._id;
    });

    // Seed Products
    console.log("Seeding Products into MongoDB...");
    const productsToInsert = productsData(categoryIds);
    const createdProducts = [];
    
    for (const prod of productsToInsert) {
      const createdProd = await Product.create(prod);
      createdProducts.push(createdProd);
    }
    console.log(`Seeded ${createdProducts.length} Products in MongoDB.`);

    // Seed Inventories in PostgreSQL
    console.log("Seeding Inventories in PostgreSQL...");
    let inventoryCount = 0;
    for (const prod of createdProducts) {
      for (const variant of prod.variants) {
        // Random stock between 10 and 50
        const stockQty = Math.floor(Math.random() * 41) + 10;
        
        await query(
          `INSERT INTO inventories (sku, stock_quantity) VALUES ($1, $2) ON CONFLICT (sku) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity;`,
          [variant.sku, stockQty]
        );
        inventoryCount++;
      }
    }
    console.log(`Seeded ${inventoryCount} inventory records in PostgreSQL.`);

    console.log("🎉 Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    // Disconnect mongoose
    await mongoose.connection.close();
    console.log("MongoDB Disconnected.");
    // End pg pool
    await pool.end();
    console.log("PostgreSQL Connection Pool Ended.");
    process.exit(0);
  }
};

seedDatabase();
