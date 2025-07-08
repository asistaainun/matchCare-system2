const { Op } = require('sequelize');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

class ProductController {
  async getAllProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        brand, 
        category, 
        skinType,
        concern,
        minRating,
        sortBy = 'rating',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Build filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { brand: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (brand) {
        whereClause.brand = brand;
      }

      if (category) {
        whereClause.mainCategory = category;
      }

      if (skinType) {
        whereClause.suitableForSkinTypes = {
          [Op.contains]: [skinType]
        };
      }

      if (concern) {
        whereClause.addressesConcerns = {
          [Op.contains]: [concern]
        };
      }

      if (minRating) {
        whereClause.rating = {
          [Op.gte]: parseFloat(minRating)
        };
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      // Add full image URLs to response
      const productsWithImageUrls = rows.map(product => {
        const productData = product.toJSON();
        productData.fullImageUrl = product.getImageUrl(`${req.protocol}://${req.get('host')}`);
        return productData;
      });

      res.json({
        success: true,
        data: {
          products: productsWithImageUrls,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          },
          filters: {
            search,
            brand,
            category,
            skinType,
            concern,
            minRating
          }
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.findByPk(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const productData = product.toJSON();
      productData.fullImageUrl = product.getImageUrl(`${req.protocol}://${req.get('host')}`);

      res.json({
        success: true,
        data: { product: productData }
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTrendingProducts(req, res) {
    try {
      const { limit = 8 } = req.query;

      const trendingProducts = await Product.findAll({
        where: {
          rating: { [Op.gte]: 4.0 }
        },
        order: [
          ['rating', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit)
      });

      const productsWithImageUrls = trendingProducts.map(product => {
        const productData = product.toJSON();
        productData.fullImageUrl = product.getImageUrl(`${req.protocol}://${req.get('host')}`);
        return productData;
      });

      res.json({
        success: true,
        data: {
          trending: productsWithImageUrls
        }
      });
    } catch (error) {
      console.error('Error fetching trending products:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const categories = await Product.findAll({
        attributes: ['mainCategory'],
        group: ['mainCategory'],
        raw: true
      });

      const categoryData = await Promise.all(
        categories.map(async (cat) => {
          const products = await Product.findAll({
            where: { mainCategory: cat.mainCategory },
            limit: 4,
            order: [['rating', 'DESC']]
          });
          
          const productsWithImageUrls = products.map(product => {
            const productData = product.toJSON();
            productData.fullImageUrl = product.getImageUrl(`${req.protocol}://${req.get('host')}`);
            return productData;
          });
          
          return {
            category: cat.mainCategory,
            products: productsWithImageUrls
          };
        })
      );

      res.json({
        success: true,
        data: categoryData
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ProductController();