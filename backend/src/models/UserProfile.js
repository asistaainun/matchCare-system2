const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Core Profile Data
  skinType: {
    type: DataTypes.ENUM('normal', 'dry', 'oily', 'combination', 'sensitive'),
    allowNull: false,
    validate: {
      isIn: [['normal', 'dry', 'oily', 'combination', 'sensitive']]
    }
  },
  skinConcerns: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    validate: {
      isValidConcerns(value) {
        const validConcerns = [
          'acne', 'wrinkles', 'fine_lines', 'sensitivity', 'dryness', 
          'oiliness', 'redness', 'large_pores', 'dullness', 
          'uneven_texture', 'dark_spots', 'dark_undereyes'
        ];
        
        if (value && Array.isArray(value)) {
          const invalidConcerns = value.filter(concern => !validConcerns.includes(concern));
          if (invalidConcerns.length > 0) {
            throw new Error(`Invalid concerns: ${invalidConcerns.join(', ')}`);
          }
          if (value.length > 6) {
            throw new Error('Maximum 6 concerns allowed');
          }
        }
      }
    }
  },
  knownSensitivities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    validate: {
      isValidSensitivities(value) {
        const validSensitivities = ['fragrance', 'alcohol', 'silicone', 'sulfate', 'paraben'];
        
        if (value && Array.isArray(value)) {
          const invalidSensitivities = value.filter(sensitivity => !validSensitivities.includes(sensitivity));
          if (invalidSensitivities.length > 0) {
            throw new Error(`Invalid sensitivities: ${invalidSensitivities.join(', ')}`);
          }
        }
      }
    }
  },
  
  // Enhanced Profile Features
  routineComplexity: {
    type: DataTypes.ENUM('simple', 'moderate', 'advanced'),
    defaultValue: 'moderate'
  },
  budgetRange: {
    type: DataTypes.ENUM('budget', 'mid_range', 'premium', 'no_preference'),
    defaultValue: 'no_preference'
  },
  
  // Semantic Analysis Results
  lastSemanticAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'Results from the most recent semantic analysis'
  },
  semanticConfidence: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Confidence score of the semantic analysis (0-100)'
  },
  recommendedIngredients: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Top recommended ingredients from semantic analysis'
  },
  
  // User Preferences and History
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional user preferences and settings'
  },
  avoidedIngredients: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Ingredients the user wants to avoid'
  },
  preferredIngredients: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Ingredients the user prefers'
  },
  
  // Quiz Metadata
  profileVersion: {
    type: DataTypes.STRING,
    defaultValue: '2.0',
    comment: 'Version of the quiz/profile system used'
  },
  lastQuizDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  quizCompletionTime: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    comment: 'Time taken to complete quiz in seconds'
  },
  profileCompleteness: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Completeness score of the profile (0-100)'
  },
  
  // Retake Management
  retakeRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  retakeRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  previousProfiles: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Historical profile data for comparison'
  },
  
  // Analytics and Tracking
  quizSource: {
    type: DataTypes.STRING,
    defaultValue: 'web',
    comment: 'Source of the quiz (web, mobile, api, etc.)'
  },
  referralSource: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'How the user found the quiz'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Browser/device information'
  }
}, {
  tableName: 'user_profiles',
  indexes: [
    { fields: ['userId'], unique: true },
    { fields: ['skinType'] },
    { fields: ['lastQuizDate'] },
    { fields: ['profileVersion'] },
    { fields: ['semanticConfidence'] },
    { 
      fields: ['skinConcerns'], 
      using: 'gin',
      name: 'user_profiles_skin_concerns_gin'
    },
    { 
      fields: ['knownSensitivities'], 
      using: 'gin',
      name: 'user_profiles_sensitivities_gin'
    }
  ],
  
  // Instance methods
  methods: {
    // Calculate profile completeness
    calculateCompleteness() {
      let completeness = 0;
      const fields = ['skinType', 'skinConcerns', 'knownSensitivities', 'routineComplexity', 'budgetRange'];
      
      fields.forEach(field => {
        if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
          completeness += 20;
        }
      });
      
      return completeness;
    },
    
    // Get profile summary
    getSummary() {
      return {
        skinType: this.skinType,
        primaryConcerns: this.skinConcerns.slice(0, 3),
        sensitivities: this.knownSensitivities.length,
        confidence: this.semanticConfidence,
        lastUpdate: this.lastQuizDate
      };
    },
    
    // Check if profile needs update
    needsUpdate() {
      const monthsOld = (new Date() - this.lastQuizDate) / (1000 * 60 * 60 * 24 * 30);
      return monthsOld > 6 || this.retakeRequested; // 6 months or manually requested
    }
  }
});
