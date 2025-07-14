'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      // Basic Product Information
      productUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Original product URL'
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Product name/title'
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'URL-friendly slug'
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Brand name'
      },
      productType: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Product type (Serum, Cleanser, etc.)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Product description'
      },
      howToUse: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Usage instructions'
      },
      ingredients: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Full ingredients list as text'
      },
      keyIngredients: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Key ingredients as JSON array'
      },
      
      // Images & Media
      imageUrls: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Image URLs as JSON array'
      },
      localImagePath: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Local image file path'
      },
      
      // Regulatory & Classification
      bpomNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'BPOM registration number'
      },
      mainCategory: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Main product category'
      },
      subcategory: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Product subcategory'
      },
      categorizationConfidence: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'ML categorization confidence'
      },
      
      // Safety & Formulation Flags
      alcoholFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      fragranceFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      parabenFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      sulfateFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      siliconeFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      
      // Enhanced Attributes
      suitableForSkinTypes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Suitable skin types as JSON array'
      },
      addressesConcerns: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Addressed skin concerns as JSON array'
      },
      providedBenefits: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Product benefits as JSON array'
      },
      
      // Popularity & Ratings
      popularityScore: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Calculated popularity score (0-100)'
      },
      userRating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Average user rating (1.00-5.00)'
      },
      reviewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // SEO & Metadata
      metaTitle: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metaDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tags: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Tags as JSON array'
      },
      
      // Status Management
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // Timestamps
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

    // Performance Indexes
    await queryInterface.addIndex('products', ['slug']);
    await queryInterface.addIndex('products', ['productName']);
    await queryInterface.addIndex('products', ['brand']);
    await queryInterface.addIndex('products', ['mainCategory']);
    await queryInterface.addIndex('products', ['popularityScore']);
    await queryInterface.addIndex('products', ['isActive']);
    await queryInterface.addIndex('products', ['brand', 'mainCategory']);
    
    console.log('✅ Products table created with indexes');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};