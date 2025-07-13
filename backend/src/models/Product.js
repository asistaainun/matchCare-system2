const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  howToUse: {
    type: DataTypes.TEXT
  },
  ingredients: {
    type: DataTypes.TEXT
  },
  keyIngredients: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  imageUrl: {
    type: DataTypes.STRING // Local image URL
  },
  originalImageUrl: {
    type: DataTypes.STRING // Original scraped URL as backup
  },
  productUrl: {
    type: DataTypes.STRING
  },
  bpomNumber: {
    type: DataTypes.STRING
  },
  mainCategory: {
    type: DataTypes.STRING
  },
  subcategory: {
    type: DataTypes.STRING
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2)
  },
  // Formulation traits
  alcoholFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fragranceFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  parabenFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sulfateFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  siliconeFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Suitability
  suitableForSkinTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  addressesConcerns: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  providedBenefits: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
    semanticScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null,
    comment: 'Overall semantic compatibility score'
  },
  ontologyTags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Tags derived from ontology analysis'
  },
  ingredientInteractions: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Known ingredient interactions within product'
  },
  
  // Enhanced Categorization
  targetSkinTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Ontology-derived target skin types'
  },
  primaryBenefits: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Primary benefits from semantic analysis'
  },
  concernsTargeted: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Specific concerns this product targets'
  },
  
  // Quality and Trust Metrics
  ingredientQualityScore: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    validate: { min: 0, max: 100 },
    comment: 'Quality score based on ingredient analysis'
  },
  formulationComplexity: {
    type: DataTypes.ENUM('simple', 'moderate', 'complex'),
    defaultValue: 'moderate'
  },
  evidenceLevel: {
    type: DataTypes.ENUM('low', 'moderate', 'high'),
    defaultValue: 'moderate',
    comment: 'Scientific evidence level for key ingredients'
  },
  
  // User Interaction Enhancements
  semanticMatches: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times product matched semantically'
  },
  lastSemanticUpdate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time semantic data was updated'
  }
}, {
  tableName: 'products',
  indexes: [
    { fields: ['brand'] },
    { fields: ['mainCategory'] },
    { fields: ['rating'] }
  ]
});

// Instance method to get full image URL
Product.prototype.getImageUrl = function(baseUrl = '') {
  if (this.imageUrl) {
    // If it's already a full URL, return as is
    if (this.imageUrl.startsWith('http')) {
      return this.imageUrl;
    }
    // Otherwise, prepend base URL
    return `${baseUrl}${this.imageUrl}`;
  }
  // Fallback to placeholder
  return `${baseUrl}/images/placeholders/product-placeholder.jpg`;
};

module.exports = Product;