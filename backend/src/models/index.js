const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database'); // FIX: Import sequelize instance, bukan config

// Import Models
const Product = require('./Product')(sequelize, Sequelize);
const Ingredient = require('./Ingredient')(sequelize, Sequelize);
const ProductIngredient = require('./ProductIngredient')(sequelize, Sequelize);
const User = require('./User')(sequelize, Sequelize);
const UserProfile = require('./UserProfile')(sequelize, Sequelize);

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

// User Profile Associations
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  Product,
  Ingredient,
  ProductIngredient,
  User,
  UserProfile
};