const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();
app.use(cors());
app.use(express.json());

const GOLD_API_KEY = process.env.GOLD_API_KEY;
const GOLD_API_URL = "https://www.goldapi.io/api/XAU/USD";
const GRAMS_PER_TROY_OUNCE = 31.1035;

// --- Veri Okuma ---
const productsPath = path.join(__dirname, "..", "products.json");

let productsData = [];
try {
  const rawData = fs.readFileSync(productsPath, "utf8");
  productsData = JSON.parse(rawData);
} catch (e) {
  console.error(
    `[ERROR] products.json okunamadı veya JSON formatı bozuk: ${e.message}`
  );
}

// --- Fonksiyonlar ---
const fetchGoldPrice = async () => {
  if (!GOLD_API_KEY) {
    throw new Error("Gold API Key bulunamadı!");
  }

  const response = await axios.get(GOLD_API_URL, {
    headers: {
      "x-access-token": GOLD_API_KEY,
      "Content-Type": "application/json",
    },
  });

  const pricePerOunce = response.data.price || response.data.ask;

  if (!pricePerOunce) {
    throw new Error("API'den geçerli fiyat ('price' alanı) alınamadı.");
  }

  return pricePerOunce / GRAMS_PER_TROY_OUNCE;
};

const calculateProductData = (product, goldPrice) => {
  const price = (product.popularityScore + 1) * product.weight * goldPrice;
  const scoreOutOf5 = (product.popularityScore * 5).toFixed(1);

  return {
    ...product,
    id: product.name.replace(/\s/g, "-").toLowerCase(),
    price: parseFloat(price.toFixed(2)),
    scoreOutOf5,
  };
};

// --- API Endpoint ---
app.get("/api/products", async (req, res) => {
  try {
    const currentGoldPrice = await fetchGoldPrice();
    const calculatedProducts = productsData.map((product) =>
      calculateProductData(product, currentGoldPrice)
    );

    res.json(calculatedProducts);
  } catch (error) {
    console.error(`[API ERROR] ${error.message}`);
    res.status(500).json({ error: "Altın fiyatı alınamadı, API hatası." });
  }
});

// --- Server Başlatma ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[SERVER] Backend API çalışıyor: http://localhost:${PORT}`);
});

module.exports = app;
