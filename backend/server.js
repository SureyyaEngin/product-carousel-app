import express from "express";
import cors from "cors";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Load product data ---
const productsPath = path.join(__dirname, "products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

// --- Fetch live gold price (USD per gram) ---
async function getGoldPriceUSD() {
  try {
    const response = await axios.get("https://api.metals.live/v1/spot");
    const gold = response.data.find((item) => item.gold);
    const goldPricePerOunce = gold.gold; // USD per ounce
    const perGram = goldPricePerOunce / 31.1035;
    return perGram;
  } catch (error) {
    console.error("Error fetching gold price:", error.message);
    return 75; // fallback value
  }
}

// --- GET /api/products ---
app.get("/api/products", async (req, res) => {
  try {
    const goldPrice = await getGoldPriceUSD();

    const result = products.map((p) => {
      const price = (p.popularityScore + 1) * p.weight * goldPrice;
      const popularity5 = (p.popularityScore * 5).toFixed(1);
      return {
        ...p,
        goldPrice: goldPrice.toFixed(2),
        price: price.toFixed(2),
        popularity5,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// --- Root route ---
app.get("/", (req, res) => {
  res.send("Product API is running 🚀");
});

// ✅ Export for Vercel Serverless
export default app;
