import express from "express";
import cors from "cors";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Load product data ---
const products = JSON.parse(fs.readFileSync("./products.json", "utf-8"));

// --- Fetch live gold price (USD per gram) ---
async function getGoldPriceUSD() {
  try {
    // Alternative free API that gives USD per gram gold price
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

    // Compute price dynamically
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
