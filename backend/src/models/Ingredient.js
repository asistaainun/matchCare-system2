const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ingredient = sequelize.define('Ingredient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    
    // Array fields with JSON handling
    alternativeNames: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('alternativeNames');
        return value ? value.split(',').map(name => name.trim()) : [];
      },
      set(value) {
        this.setDataValue('alternativeNames', Array.isArray(value) ? value.join(', ') : value);
      }
    },
    actualFunctions: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('actualFunctions');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(f => f.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('actualFunctions', JSON.stringify(value || []));
      }
    },
    functionalCategories: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('functionalCategories');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(f => f.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('functionalCategories', JSON.stringify(value || []));
      }
    },
    keyIngredientTypes: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('keyIngredientTypes');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(f => f.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('keyIngredientTypes', JSON.stringify(value || []));
      }
    },
    suitableForSkinTypes: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('suitableForSkinTypes');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(f => f.trim()) : [];
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
          return value ? value.split(',').map(f => f.trim()) : [];
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
          return value ? value.split(',').map(f => f.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('providedBenefits', JSON.stringify(value || []));
      }
    },
    sensitivities: {
      type: DataTypes.TEXT,
      get() {
        const value = this.getDataValue('sensitivities');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return value ? value.split(',').map(f => f.trim()) : [];
        }
      },
      set(value) {
        this.setDataValue('sensitivities', JSON.stringify(value || []));
      }
    },
    
    // Basic fields
    description: DataTypes.TEXT,
    whatItDoes: DataTypes.STRING,
    
    // Flags
    isKeyIngredient: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isMultifunctional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasComprehensiveData: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Safety
    pregnancySafe: DataTypes.STRING,
    alcoholFree: DataTypes.BOOLEAN,
    fragranceFree: DataTypes.BOOLEAN,
    siliconeFree: DataTypes.BOOLEAN,
    sulfateFree: DataTypes.BOOLEAN,
    parabenFree: DataTypes.BOOLEAN,
    
    // Detailed info
    explanation: DataTypes.TEXT,
    benefit: DataTypes.TEXT,
    safety: DataTypes.TEXT,
    url: DataTypes.STRING,
    
    // Guidelines
    concentrationGuidelines: DataTypes.DECIMAL(5, 2),
    interactionWarnings: DataTypes.TEXT,
    skinTypeNotes: DataTypes.TEXT,
    
    // Scoring
    popularityScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    efficacyRating: {
      type: DataTypes.DECIMAL(3, 1),
      validate: { min: 1.0, max: 10.0 }
    },
    safetyRating: {
      type: DataTypes.DECIMAL(3, 1),
      validate: { min: 1.0, max: 10.0 }
    }
  }, {
    tableName: 'ingredients',
    hooks: {
      beforeValidate: (ingredient) => {
        if (ingredient.name && !ingredient.slug) {
          ingredient.slug = ingredient.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
      }
    }
  });

  return Ingredient;
};