import Product from "../models/Product.js";
import mongoose from "mongoose";
import axios from "axios";

// Update the getCoordinatesFromPincode function for better accuracy
export const getCoordinatesFromPincode = async (pincode) => {
  try {
    const apiKey = process.env.OPENCAGE_API_KEY;
    // Add more specific parameters for better accuracy
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      `${pincode}, India`
    )}&key=${apiKey}&countrycode=in&limit=1&no_annotations=1&language=en&abbrv=1`;
    
    console.log(`Fetching coordinates for pincode: ${pincode}`);
    const response = await axios.get(url);
    
    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry;
      const confidence = result.confidence;
      const formattedLocation = result.formatted;

      console.log(`Location details for ${pincode}:
        Address: ${formattedLocation}
        Latitude: ${lat}
        Longitude: ${lng}
        Confidence: ${confidence}/10`);

      return { 
        lat, 
        lng,
        confidence,
        formatted: formattedLocation
      };
    }
    
    console.warn(`No coordinates found for pincode: ${pincode}`);
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return null;
  }
};

// Update the calculateDistanceKm function for all-India usage
export const calculateDistanceKm = (coords1, coords2) => {
  try {
    // Validate coordinates are within India's bounds
    // India bounds: 6°N-37°N, 68°E-97°E
    const isInIndia = (lat, lng) => {
      return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97;
    };

    if (!isInIndia(coords1.lat, coords1.lng) || !isInIndia(coords2.lat, coords2.lng)) {
      console.warn('Coordinates outside India bounds');
      return Infinity;
    }

    // Earth's radius in kilometers (mean radius for India)
    const R = 6371.0;

    const lat1 = coords1.lat * Math.PI / 180;
    const lat2 = coords2.lat * Math.PI / 180;
    const deltaLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const deltaLon = (coords2.lng - coords1.lng) * Math.PI / 180;

    // Haversine formula
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Calculate direct distance
    const directDistance = R * c;

    // Adjust multiplier based on distance
    // Shorter distances have lower multipliers
    let roadMultiplier;
    if (directDistance <= 20) {
      roadMultiplier = 1.2; // Local routes
    } else if (directDistance <= 50) {
      roadMultiplier = 1.3; // Regional routes
    } else if (directDistance <= 100) {
      roadMultiplier = 1.4; // State routes
    } else {
      roadMultiplier = 1.5; // Interstate routes
    }

    const roadDistance = directDistance * roadMultiplier;

    console.log(`Distance calculation:
      From: ${coords1.formatted || `${coords1.lat}°N, ${coords1.lng}°E`}
      To: ${coords2.formatted || `${coords2.lat}°N, ${coords2.lng}°E`}
      Direct Distance: ${directDistance.toFixed(2)} km
      Road Multiplier: ${roadMultiplier}x
      Estimated Road Distance: ${roadDistance.toFixed(2)} km`);
      
    return roadDistance;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return Infinity;
  }
};

// Add new product
export const addProduct = async (req, res) => {
  try {
    console.log("Creating product, received body:", req.body);
    console.log("File received:", req.file);

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    const {
      name,
      category,
      price,
      available_quantity,
      description,
      farmer_id,
      unit, // Added unit field
      discount, // Add discount field
    } = req.body;

    const traceability = JSON.parse(req.body.traceability);

    // Validate required fields
    if (!name || !category || !price || !description || !farmer_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required product information",
      });
    }

    // Validate available_quantity is provided and is a number
    if (!available_quantity || isNaN(Number(available_quantity))) {
      return res.status(400).json({
        success: false,
        message: "Available quantity is required and must be a number",
      });
    }

    // Validate discount is between 0-100
    const discountValue = parseFloat(discount) || 0;
    if (discountValue < 0 || discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 100 percent",
      });
    }

    // Extract traceability fields from the FormData
    Object.keys(req.body).forEach((key) => {
      if (key.startsWith("traceability[")) {
        const fieldName = key.replace("traceability[", "").replace("]", "");
        traceability[fieldName] = req.body[key];
        console.log("Extracted traceability field:", fieldName, req.body[key]);
      }
    });

    console.log("Extracted traceability data:", traceability);

    // Create image URL for frontend access
    const imageUrl = `/api/products/image/${req.file.filename}`;
    console.log("file id" + req.file.id);
    console.log("image url" + imageUrl);

    // Create new product
    const product = await Product.create({
      name,
      category,
      price: Number(price),
      discount: discountValue,
      available_quantity: Number(available_quantity),
      description,
      unit: unit || "kg", // Use the unit field correctly
      image_id: req.file.id,
      image_url: imageUrl,
      farmer_id,
      traceability,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

export const getProductImage = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads",
    });

    const { filename } = req.params;
    const file = await db.collection("uploads.files").findOne({ filename });

    if (!file) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Set the correct content type
    res.set("Content-Type", file.contentType);

    // Stream the file to the response
    bucket.openDownloadStreamByName(filename).pipe(res);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Failed to fetch image" });
  }
};

// Get products by farmer ID
export const getProductbyId = async (req, res) => {
  try {
    console.log('Received farmer ID:', req.params);
    const { farmer_id } = req.params;
    console.log('Received farmer ID:', farmer_id);
    const products = await Product.find({ farmer_id })
      .sort({ createdAt: -1 });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found for this farmer",
      });
    }

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Search products by category
export const searchProductByCatagory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category })
      .sort({ createdAt: -1 });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found in this category",
      });
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

// Edit product
export const editProducts = async (req, res) => {
  try {
    const { product_id } = req.params;
    const updates = { ...req.body };

    // Handle image update if new image is uploaded
    if (req.file) {
      updates.image_url = `/uploads/products/${req.file.filename}`;
    }

    // Handle traceability updates if provided
    if (req.body["traceability.farm_location"] ||
      req.body["traceability.harvest_date"] ||
      req.body["traceability.harvest_method"] ||
      req.body["traceability.certified_by"]) {
      updates.traceability = {
        farm_location: req.body["traceability.farm_location"],
        harvest_date: req.body["traceability.harvest_date"],
        harvest_method: req.body["traceability.harvest_method"],
        certified_by: req.body["traceability.certified_by"],
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      product_id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findById(product_id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product details",
      error: error.message,
    });
  }
};


// Delete product
// Delete product
export const deleteProducts = async (req, res) => {
  try {
    // Extract product ID from parameters - support both formats
    const product_id = req.params.product_id || req.params.id;
    console.log('Received product ID:', product_id);
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required for deletion",
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(product_id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteProducts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

export const getUniqueProducts = async (req, res) => {
  try {
    // Get all products
    const allProducts = await Product.find().sort({ createdAt: -1 });

    // Create a map to store unique products by name
    const uniqueProductsMap = new Map();

    // Process each product
    allProducts.forEach(product => {
      if (!uniqueProductsMap.has(product.name)) {
        // Store the first instance of each product name
        uniqueProductsMap.set(product.name, {
          _id: product._id,
          name: product.name,
          description: product.description,
          category: product.category,
          image_url: product.image_url,
          price: product.price, // We'll show the price of the first farmer for display
          count: 1 // Track how many farmers sell this
        });
      } else {
        // Just increment the count for existing products
        const existing = uniqueProductsMap.get(product.name);
        existing.count += 1;
      }
    });

    // Convert map to array
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    res.status(200).json({
      success: true,
      count: uniqueProducts.length,
      products: uniqueProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching unique products",
      error: error.message
    });
  }
};

// Get all farmers selling a specific product
// In your productController.js, update the getFarmersForProduct function
// In your productController.js, update the getFarmersForProduct function
export const getFarmersForProduct = async (req, res) => {
  try {
    const { productName } = req.params;
    const maxDistance = 500; // Increased for Indian road conditions and rural connectivity
    let consumerPincode = (req.user && req.user.pincode) ? req.user.pincode : req.query.pincode;

    // Add debug logging
    console.log(`Processing request for product: ${productName}`);
    console.log(`Consumer pincode: ${consumerPincode}`);
    console.log(`User from token:`, req.user);

    if (!consumerPincode) {
      return res.status(400).json({
        success: false,
        message: "Consumer pincode is required. Please update your profile with your pincode.",
      });
    }

    const consumerCoords = await getCoordinatesFromPincode(consumerPincode);
    if (!consumerCoords) {
      return res.status(400).json({
        success: false,
        message: "Unable to find location for the provided pincode. Please check your pincode in profile settings.",
      });
    }

    const products = await Product.find({
      name: { $regex: new RegExp('^' + productName + '$', 'i') }
    }).populate('farmer_id', 'name email phoneNumber location role profileImage pincode');

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: `No farmers are currently selling ${productName}. Try browsing other products.`,
      });
    }

    const productDetails = {
      name: products[0].name,
      description: products[0].description,
      category: products[0].category,
      image_url: products[0].image_url,
    };

    const farmersPromises = products.map(async product => {
      const farmer = product.farmer_id;
      if (!farmer || !farmer.pincode) {
        console.log(`Skipping farmer - missing pincode: ${farmer?.name || 'Unknown'}`);
        return null;
      }
      
      const farmerCoords = await getCoordinatesFromPincode(farmer.pincode);
      if (!farmerCoords) {
        console.log(`Could not get coordinates for farmer ${farmer.name} with pincode ${farmer.pincode}`);
        return null;
      }
      
      const distance = calculateDistanceKm(consumerCoords, farmerCoords);
      
      // Log all farmers and their distances for debugging
      console.log(`Farmer ${farmer.name} (${farmer.pincode}): ${distance.toFixed(2)} km`);
      
      if (distance > maxDistance) {
        console.log(`Excluding farmer ${farmer.name} - distance ${distance.toFixed(2)} km exceeds limit ${maxDistance} km`);
        return null;
      }

      return {
        farmer_id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        farmer_mobile: farmer.phoneNumber,
        farmer_location: `${farmer.location?.city || farmer.location?.district || 'Unknown City'}, ${farmer.location?.state || 'Unknown State'}`,
        role: farmer.role,
        profileImage: farmer.profileImage,
        pincode: farmer.pincode,
        distance: Math.round(distance * 10) / 10,
        price: product.price,
        available_quantity: product.available_quantity,
        product_id: product._id,
        traceability: product.traceability
      };
    });

    let farmersWithDistance = await Promise.all(farmersPromises);
    const farmers = farmersWithDistance
      .filter(farmer => farmer !== null)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    if (farmers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No nearby farmers found selling ${productName} within ${maxDistance} km of your location (${consumerPincode}). Try browsing other products or check back later.`,
      });
    }

    res.status(200).json({
      success: true,
      product: productDetails,
      farmers,
      count: farmers.length,
      searchRadius: maxDistance,
      userLocation: consumerPincode
    });
  } catch (error) {
    console.error('Detailed error in getFarmersForProduct:', error);
    res.status(500).json({
      success: false,
      message: "Error finding farmers for this product. Please try again.",
      error: error.message,
    });
  }
};
