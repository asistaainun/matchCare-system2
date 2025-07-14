const { Sequelize } = require('sequelize');
require('dotenv').config();

// Direct sequelize creation
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'matchcare_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: false
});

// Import ONLY existing models
const Product = require('./Product')(sequelize, Sequelize);
const Ingredient = require('./Ingredient')(sequelize, Sequelize);
const ProductIngredient = require('./ProductIngredient')(sequelize, Sequelize);

// Simple Associations
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

module.exports = {
  sequelize,
  Sequelize,
  Product,
  Ingredient,
  ProductIngredient
};