const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config);

// Import Models
const Product = require('./Product')(sequelize);
const Ingredient = require('./Ingredient')(sequelize);
const ProductIngredient = require('./ProductIngredient')(sequelize);

// Define Associations
Product.belongsToMany(Ingredient, {
  through: ProductIngredient,
  foreignKey: 'productId',
  otherKey: 'ingredientId',
  as: 'ingredients'
});

Ingredient.belongsToMany(Product, {
  through: ProductIngredient,
  foreignKey: 'ingredientId',
  otherKey: 'productId',
  as: 'products'
});

Product.hasMany(ProductIngredient, {
  foreignKey: 'productId',
  as: 'productIngredients'
});

Ingredient.hasMany(ProductIngredient, {
  foreignKey: 'ingredientId',
  as: 'ingredientProducts'
});

ProductIngredient.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

ProductIngredient.belongsTo(Ingredient, {
  foreignKey: 'ingredientId',
  as: 'ingredient'
});

module.exports = {
  sequelize,
  Product,
  Ingredient,
  ProductIngredient
};