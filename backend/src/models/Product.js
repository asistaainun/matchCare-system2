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