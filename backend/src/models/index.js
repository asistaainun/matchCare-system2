// UserProfile associations
UserProfile.belongsTo(sequelize.models.User, { foreignKey: 'userId', as: 'user' });
sequelize.models.User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });

// GuestSession associations
GuestSession.belongsTo(sequelize.models.User, { 
  foreignKey: 'convertedToUserId', 
  as: 'convertedUser',
  allowNull: true 
});

// Ingredient associations (many-to-many with products)
if (sequelize.models.Product) {
  sequelize.models.Product.belongsToMany(Ingredient, {
    through: 'ProductIngredients',
    foreignKey: 'productId',
    otherKey: 'ingredientId',
    as: 'ingredients'
  });
  
  Ingredient.belongsToMany(sequelize.models.Product, {
    through: 'ProductIngredients',
    foreignKey: 'ingredientId',
    otherKey: 'productId',
    as: 'products'
  });
}

// Self-referencing associations for ingredient interactions
Ingredient.belongsToMany(Ingredient, {
  through: 'IngredientInteractions',
  as: 'synergisticWith',
  foreignKey: 'ingredientAId',
  otherKey: 'ingredientBId',
  scope: { interactionType: 'synergistic' }
});

Ingredient.belongsToMany(Ingredient, {
  through: 'IngredientInteractions', 
  as: 'incompatibleWith',
  foreignKey: 'ingredientAId',
  otherKey: 'ingredientBId',
  scope: { interactionType: 'incompatible' }
});

module.exports = {
  UserProfile,
  GuestSession,
  Ingredient,
  enhancedProductFields
};