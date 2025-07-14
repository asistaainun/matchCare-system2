const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productUrl: DataTypes.TEXT,
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    productType: DataTypes.STRING,
    description: DataTypes.TEXT,
    howToUse: DataTypes.TEXT,
    ingredients: DataTypes.TEXT,
    
    // JSON Array Fields
    keyIngredients: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('keyIngredients');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(i => i.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('keyIngredients', JSON.stringify(value || []));
      }
    },
    imageUrls: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('imageUrls');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? [value] : [];
        }
      },
      set(value) {
        this.setDataValue('imageUrls', JSON.stringify(value || []));
      }
    },
    suitableForSkinTypes: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('suitableForSkinTypes');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(s => s.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('suitableForSkinTypes', JSON.stringify(value || []));
      }
    },
    addressesConcerns: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('addressesConcerns');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(c => c.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('addressesConcerns', JSON.stringify(value || []));
      }
    },
    providedBenefits: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('providedBenefits');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(b => b.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('providedBenefits', JSON.stringify(value || []));
      }
    },
    tags: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('tags');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(t => t.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      }
    },
    
    // Other fields
    localImagePath: DataTypes.STRING,
    bpomNumber: DataTypes.STRING,
    mainCategory: DataTypes.STRING,
    subcategory: DataTypes.STRING,
    categorizationConfidence: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    
    // Safety flags
    alcoholFree: DataTypes.BOOLEAN,
    fragranceFree: DataTypes.BOOLEAN,
    parabenFree: DataTypes.BOOLEAN,
    sulfateFree: DataTypes.BOOLEAN,
    siliconeFree: DataTypes.BOOLEAN,
    
    // Scoring
    popularityScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    userRating: {
      type: DataTypes.DECIMAL(3, 2),
      validate: { min: 1.0, max: 5.0 }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    // Meta
    metaTitle: DataTypes.STRING,
    metaDescription: DataTypes.TEXT,
    
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'products',
    hooks: {
      beforeValidate: (product) => {
        // Auto-generate slug
        if (product.productName && product.brand && !product.slug) {
          const baseSlug = `${product.brand}-${product.productName}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          product.slug = baseSlug;
        }
      },
      beforeCreate: (product) => {
        product.popularityScore = calculatePopularityScore(product);
      },
      beforeUpdate: (product) => {
        product.popularityScore = calculatePopularityScore(product);
      }
    }
  });

  // Popularity score calculation
  function calculatePopularityScore(product) {
    let score = 0;
    
    if (product.userRating) score += (product.userRating / 5) * 30;
    if (product.reviewCount) score += Math.min(20, Math.log10(product.reviewCount + 1) * 10);
    if (product.description && product.description.length > 50) score += 10;
    if (product.keyIngredients && product.keyIngredients.length > 0) score += 10;
    if (product.isFeatured) score += 10;
    if (product.isVerified) score += 5;
    
    const safetyFlags = [product.alcoholFree, product.fragranceFree, product.parabenFree];
    score += safetyFlags.filter(flag => flag === true).length * 2;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  return Product;
};