'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_ingredients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ingredientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ingredients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      concentration: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Ingredient concentration % if known'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Position in ingredient list (1 = first)'
      },
      isKeyIngredient: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a key ingredient for this product'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Unique constraint and indexes
    await queryInterface.addConstraint('product_ingredients', {
      fields: ['productId', 'ingredientId'],
      type: 'unique',
      name: 'unique_product_ingredient'
    });

    await queryInterface.addIndex('product_ingredients', ['productId']);
    await queryInterface.addIndex('product_ingredients', ['ingredientId']);
    await queryInterface.addIndex('product_ingredients', ['isKeyIngredient']);
    
    console.log('✅ Product-Ingredients junction table created');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_ingredients');
  }
};