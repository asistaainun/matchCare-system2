'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ingredients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      
      // Basic Information
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Primary ingredient name'
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'URL-friendly slug'
      },
      alternativeNames: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Alternative names as comma-separated'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ingredient description'
      },
      
      // Functional Information
      whatItDoes: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Primary function (humectant, emollient, etc.)'
      },
      actualFunctions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed functions as JSON array'
      },
      functionalCategories: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Functional categories as JSON array'
      },
      keyIngredientTypes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Key ingredient types as JSON array'
      },
      
      // Classification Flags
      isKeyIngredient: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a key/star ingredient'
      },
      isMultifunctional: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether ingredient has multiple functions'
      },
      hasComprehensiveData: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Data completeness flag'
      },
      
      // Skin Compatibility
      suitableForSkinTypes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Suitable skin types as JSON array'
      },
      addressesConcerns: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Skin concerns addressed as JSON array'
      },
      providedBenefits: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Benefits provided as JSON array'
      },
      
      // Safety Information
      pregnancySafe: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Pregnancy safety information'
      },
      sensitivities: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Known sensitivities as JSON array'
      },
      
      // Formulation Flags
      alcoholFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      fragranceFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      siliconeFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      sulfateFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      parabenFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: null
      },
      
      // Detailed Information
      explanation: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed explanation'
      },
      benefit: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Primary benefits description'
      },
      safety: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Safety information'
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Reference URL'
      },
      
      // Usage Guidelines
      concentrationGuidelines: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Recommended concentration %'
      },
      interactionWarnings: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ingredient interaction warnings'
      },
      skinTypeNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Skin type specific notes'
      },
      
      // Scoring & Ratings
      popularityScore: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Popularity score (0-100)'
      },
      efficacyRating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: 'Efficacy rating (1.0-10.0)'
      },
      safetyRating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: 'Safety rating (1.0-10.0)'
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
    await queryInterface.addIndex('ingredients', ['name']);
    await queryInterface.addIndex('ingredients', ['slug']);
    await queryInterface.addIndex('ingredients', ['isKeyIngredient']);
    await queryInterface.addIndex('ingredients', ['popularityScore']);
    await queryInterface.addIndex('ingredients', ['whatItDoes']);
    
    console.log('✅ Ingredients table created with indexes');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ingredients');
  }
};