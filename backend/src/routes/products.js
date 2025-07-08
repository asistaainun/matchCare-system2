const express = require('express');
const productController = require('../controllers/productController');
const { validateProductQuery } = require('../middleware/validation');

const router = express.Router();

// Get all products with filtering
router.get('/', validateProductQuery, productController.getAllProducts);

// Get trending products
router.get('/trending', productController.getTrendingProducts);

// Get products by category
router.get('/categories', productController.getProductsByCategory);

// Get specific product
router.get('/:id', productController.getProductById);

module.exports = router;