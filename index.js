import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add this: Path to our products JSON file
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Load products from file or use default if file doesn't exist
let products = [
  { pid: "491772", name: "Big Cap", image: null },
  { pid: "444799", name: "Long Bottle", image: null },
  { pid: "783984", name: "Oil", image: null },
  { pid: "594032", name: "Nuts", image: null },
  { pid: "364839", name: "Ghee", image: null },
  { pid: "494034", name: "Brown Sugar", image: null },
  { pid: "784839", name: "Sun Lotion", image: null },
  { pid: "483805", name: "Gentle Wash", image: null },
];

// Add this: Load products from file if it exists
if (fs.existsSync(PRODUCTS_FILE)) {
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  products = JSON.parse(data);
} else {
  // Save initial products to file
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Add this: Function to save products to file
const saveProducts = () => {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow frontend domain
  methods: ['GET', 'POST'],        // Allow specific methods
  allowedHeaders: ['Content-Type'] // Allow specific headers
}));
app.use(express.json());
app.use('/images', express.static("uploads"));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const { pid } = req.body;
    // Add timestamp to make filename unique
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${pid}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// 📌 Search products by PID
app.post("/search", (req, res) => {
  const { pids } = req.body;
  const filteredProducts = products
    .filter((prod) => pids.includes(prod.pid))
    .map((prod) => ({
      ...prod,
      image: prod.image
    }));

  console.log("Filtered products:", filteredProducts);
  res.json(filteredProducts);
});

// 📌 Upload and assign PNG to a PID
app.post("/upload", upload.single("image"), (req, res) => {
  const { pid } = req.body;
  const filename = req.file.filename;

  const product = products.find((p) => p.pid === pid);
  if (product) {
    if (product.image) {
      const oldImagePath = path.join(__dirname, "uploads", product.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    product.image = filename;
    
    // Add this: Save changes to file
    saveProducts();
  }

  console.log("Updated product:", product);
  res.json({ message: "Image assigned successfully", filename });
});

// 📌 Serve images
app.get("/images/:filename", (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, "uploads", filename);
  
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
}); 