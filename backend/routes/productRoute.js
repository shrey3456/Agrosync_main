import express from "express";
import { 
  addProduct,
  getProductbyId,
  getAllProducts, 
  searchProductByCatagory,
  editProducts,
  deleteProducts,
  getSingleProduct,
  getFarmersForProduct,
  getUniqueProducts,
  getProductImage
} from "../controllers/productController.js";
import upload from '../middlewares/upload.js';

import { authenticate } from "../middlewares/authMiddleware.js"; // Auth middleware only for getFarmersForProduct

const router = express.Router();
router.post("/add-product", upload.single("image"), addProduct);
router.get('/image/:filename', getProductImage);
router.get("/farmer/:farmer_id", getProductbyId);
router.get("/consumer/allproducts", getAllProducts);
router.get("/category/:category", searchProductByCatagory);
router.get("/:product_id", getSingleProduct);
router.put("/update/:product_id", upload.single("image"), editProducts);
router.delete("/delete/:product_id", deleteProducts);
router.get('/unique', getUniqueProducts);
router.get('/farmers/:productName', authenticate, getFarmersForProduct);



export { router as productRoute };
