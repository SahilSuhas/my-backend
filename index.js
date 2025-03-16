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
const PORT = process.env.PORT || 5000;  // Using port 5000 for development

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/images', express.static("uploads"));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const { pid } = req.body;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    // Make sure pid is defined before using it in filename
    const filename = pid ? `${pid}_${timestamp}${ext}` : `image_${timestamp}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Add a root route
app.get('/', (req, res) => {
  res.json({
    message: 'Catalogue API is running',
    endpoints: {
      search: 'POST /search',
      upload: 'POST /upload',
      images: 'GET /images/:filename'
    }
  });
});

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

// Add this new API endpoint for n8n
app.get("/api/catalogue", (req, res) => {
  const { pid1, pid2 } = req.query;

  if (!pid1 || !pid2) {
    return res.status(400).json({ 
      error: "Missing PID parameters" 
    });
  }

  // Find products by PIDs
  const product1 = products.find(p => p.pid === pid1);
  const product2 = products.find(p => p.pid === pid2);

  // Construct response with proper image URL handling
  const response = {
    product1: product1 ? {
      pid: product1.pid,
      name: product1.name,
      image_url: product1.image 
        ? `https://sahil-catalogue.onrender.com/images/${product1.image}`
        : null
    } : null,
    product2: product2 ? {
      pid: product2.pid,
      name: product2.name,
      image_url: product2.image 
        ? `https://sahil-catalogue.onrender.com/images/${product2.image}`
        : null
    } : null
  };

  // Log the response for debugging
  console.log("API Response:", response);

  res.status(200).json(response);
});

// Add error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Add general error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
console.log(`🌍 Accessible at: https://sahil-catalogue.onrender.com`);
}); 