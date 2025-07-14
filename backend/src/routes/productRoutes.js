const express = require('express');
const { Product, Ingredient } = require('../models');
const enhancedRecommendationService = require('../services/enhancedRecommendationService');
const { Op } = require('sequelize');
const router = express.Router();

// Get Products with Advanced Filtering
router.get('/', async (req, res) => {
  try {
    const {
      search,
      brand,
      category,
      skinType,
      concerns,
      alcoholFree,
      fragranceFree,
      page = 1,
      limit = 20
    } = req.query;

    const where = { isActive: true };
    const offset = (page - 1) * limit;

    // Search functionality
    if (search) {
      where[Op.or] = [
        { productName: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Brand filter
    if (brand) {
      where.brand = { [Op.iLike]: `%${brand}%` };
    }

    // Category filter
    if (category) {
      where[Op.or] = [
        { mainCategory: { [Op.iLike]: `%${category}%` } },
        { subcategory: { [Op.iLike]: `%${category}%` } }
      ];
    }

    // Skin type filter
    if (skinType) {
      where.suitableForSkinTypes = { [Op.contains]: [skinType] };
    }

    // Concerns filter
    if (concerns) {
      const concernArray = concerns.split(',');
      where.addressesConcerns = { [Op.overlap]: concernArray };
    }

    // Safety filters
    if (alcoholFree === 'true') where.alcoholFree = true;
    if (fragranceFree === 'true') where.fragranceFree = true;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{
        model: Ingredient,
        as: 'ingredients',
        through: { attributes: ['isKeyIngredient'] }
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          hasNext: page * limit < count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Products fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get Single Product with Recommendations
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Ingredient,
        as: 'ingredients',
        through: { attributes: ['isKeyIngredient'] }
      }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get similar products based on ingredients and category
    const similarProducts = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        [Op.or]: [
          { keyIngredients: { [Op.overlap]: product.keyIngredients || [] } },
          { mainCategory: product.mainCategory },
          { brand: product.brand }
        ],
        isActive: true
      },
      limit: 6,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        product,
        similarProducts,
        recommendations: {
          basedOn: 'Similar ingredients and category',
          count: similarProducts.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Product fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Get Personalized Product Recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const userProfile = req.body;
    const options = {
      limit: req.query.limit || 15,
      category: req.query.category,
      brand: req.query.brand
    };

    const recommendations = await enhancedRecommendationService
      .getPersonalizedRecommendations(userProfile, options);

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

module.exports = router;