const express = require('express');
const router = express.Router();
const { Product, Ingredient, ProductIngredient } = require('../models');
const { Op } = require('sequelize');

// GET /api/products - List with full filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      brand = '',
      category = '',
      skinType = '',
      concern = '',
      alcoholFree = '',
      fragranceFree = '',
      parabenFree = '',
      sortBy = 'popularityScore',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { isActive: true };

    // Search
    if (search) {
      whereClause[Op.or] = [
        { productName: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filters
    if (brand) whereClause.brand = { [Op.iLike]: `%${brand}%` };
    if (category) whereClause.mainCategory = { [Op.iLike]: `%${category}%` };
    if (alcoholFree === 'true') whereClause.alcoholFree = true;
    if (fragranceFree === 'true') whereClause.fragranceFree = true;
    if (parabenFree === 'true') whereClause.parabenFree = true;

    // JSON array filters
    if (skinType) {
      whereClause.suitableForSkinTypes = { [Op.like]: `%"${skinType}"%` };
    }
    if (concern) {
      whereClause.addressesConcerns = { [Op.like]: `%"${concern}"%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [{
        model: Ingredient,
        as: 'ingredients',
        attributes: ['id', 'name', 'slug', 'whatItDoes'],
        through: { 
          attributes: ['isKeyIngredient'],
          where: { isKeyIngredient: true },
          required: false
        },
        limit: 5
      }]
    });

    res.json({
      success: true,
      data: {
        products: rows.map(product => ({
          ...product.toJSON(),
          imageUrl: getProductImageUrl(product)
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// GET /api/products/:slug - Product details with ingredients
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        slug: req.params.slug,
        isActive: true 
      },
      include: [{
        model: Ingredient,
        as: 'ingredients',
        through: {
          attributes: ['position', 'isKeyIngredient', 'concentration']
        }
      }]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get similar products
    const similarProducts = await Product.findAll({
      where: {
        id: { [Op.ne]: product.id },
        [Op.or]: [
          { mainCategory: product.mainCategory },
          { brand: product.brand }
        ],
        isActive: true
      },
      limit: 6,
      order: [['popularityScore', 'DESC']]
    });

    // Format ingredients
    const sortedIngredients = product.ingredients
      .sort((a, b) => (a.ProductIngredient.position || 999) - (b.ProductIngredient.position || 999))
      .map(ingredient => ({
        ...ingredient.toJSON(),
        position: ingredient.ProductIngredient.position,
        isKeyIngredient: ingredient.ProductIngredient.isKeyIngredient,
        concentration: ingredient.ProductIngredient.concentration
      }));

    res.json({
      success: true,
      data: {
        product: {
          ...product.toJSON(),
          imageUrl: getProductImageUrl(product)
        },
        ingredients: {
          key: sortedIngredients.filter(ing => ing.isKeyIngredient),
          all: sortedIngredients,
          count: sortedIngredients.length
        },
        similarProducts: similarProducts.map(p => ({
          ...p.toJSON(),
          imageUrl: getProductImageUrl(p)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// Helper function
function getProductImageUrl(product) {
  const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const localPath = product.localImagePath;
  
  if (localPath) return `/images/products/${localPath}`;
  if (imageUrls.length > 0) return imageUrls[0];
  return '/images/placeholders/product-placeholder.svg';
}

module.exports = router;