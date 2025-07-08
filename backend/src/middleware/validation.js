const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

const validateProductQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search query too long'),
  query('brand').optional().isLength({ max: 50 }).withMessage('Brand name too long'),
  query('category').optional().isLength({ max: 50 }).withMessage('Category name too long'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  handleValidationErrors
];

module.exports = {
  validateProductQuery,
  handleValidationErrors
};