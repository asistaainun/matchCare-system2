const express = require('express');
const router = express.Router();
const { Ingredient, Product, ProductIngredient } = require('../models');
const { Op } = require('sequelize');

// GET /api/ingredients - List with search and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      keyIngredientsOnly = false,
      sortBy = 'popularityScore',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { alternativeNames: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (keyIngredientsOnly === 'true') {
      whereClause.isKeyIngredient = true;
    }

    const { count, rows } = await Ingredient.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [{
        model: Product,
        as: 'products',
        attributes: ['id', 'productName', 'brand'],
        through: { attributes: [] },
        limit: 3
      }]
    });

    res.json({
      success: true,
      data: {
        ingredients: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ingredients',
      message: error.message
    });
  }
});

// GET /api/ingredients/:slug - Ingredient details
router.get('/:slug', async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: { slug: req.params.slug },
      include: [{
        model: Product,
        as: 'products',
        attributes: ['id', 'productName', 'brand', 'imageUrls', 'mainCategory'],
        through: {
          attributes: ['position', 'isKeyIngredient']
        }
      }]
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        error: 'Ingredient not found'
      });
    }

    res.json({
      success: true,
      data: {
        ingredient,
        stats: {
          totalProducts: ingredient.products.length,
          keyIngredientProducts: ingredient.products.filter(p => 
            p.ProductIngredient.isKeyIngredient
          ).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching ingredient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ingredient',
      message: error.message
    });
  }
});

module.exports = router;