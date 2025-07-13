const Ingredient = sequelize.define('Ingredient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Basic Information
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  commonName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Common/marketing name'
  },
  incideName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'INCI (International Nomenclature) name'
  },
  alternativeNames: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Alternative names and synonyms'
  },
  
  // Ontology Data
  ontologyUri: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URI in the skincare ontology'
  },
  semanticCategory: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Semantic category from ontology'
  },
  functionalCategories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Functional categories (humectant, exfoliant, etc.)'
  },
  
  // Scientific Properties
  molecularWeight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  solubility: {
    type: DataTypes.ENUM('water', 'oil', 'both', 'neither'),
    allowNull: true
  },
  phRange: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Optimal pH range {min, max}'
  },
  stability: {
    type: DataTypes.ENUM('low', 'moderate', 'high'),
    defaultValue: 'moderate'
  },
  
  // Efficacy and Safety
  efficacyScore: {
    type: DataTypes.INTEGER,
    validate: { min: 0, max: 100 },
    comment: 'Scientific efficacy rating'
  },
  safetyRating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 10 },
    comment: 'Safety rating (1=low, 10=very safe)'
  },
  comedogenicRating: {
    type: DataTypes.INTEGER,
    validate: { min: 0, max: 5 },
    allowNull: true,
    comment: 'Comedogenic rating (0=non-comedogenic, 5=highly comedogenic)'
  },
  irritationPotential: {
    type: DataTypes.ENUM('low', 'moderate', 'high'),
    defaultValue: 'low'
  },
  
  // Usage Information
  recommendedConcentration: {
    type: DataTypes.JSONB,
    comment: 'Recommended concentration range {min, max, unit}'
  },
  usageFrequency: {
    type: DataTypes.ENUM('daily', 'alternate', 'weekly', 'as_needed'),
    allowNull: true
  },
  timeOfUse: {
    type: DataTypes.ARRAY(DataTypes.ENUM('morning', 'evening', 'anytime')),
    defaultValue: ['anytime']
  },
  
  // Interaction Data
  synergisticIngredients: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'Ingredients that work well together'
  },
  incompatibleIngredients: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'Ingredients to avoid combining'
  },
  
  // Skin Compatibility
  suitableForSkinTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Skin types this ingredient suits'
  },
  skinConcernsBenefits: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Skin concerns this ingredient addresses'
  },
  contraindications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Conditions where this ingredient should be avoided'
  },
  
  // Evidence and Sources
  evidenceLevel: {
    type: DataTypes.ENUM('limited', 'moderate', 'strong'),
    defaultValue: 'moderate'
  },
  studiesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of scientific studies'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  // Product Relations
  productCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of products containing this ingredient'
  },
  popularityScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Popularity score based on usage'
  }
}, {
  tableName: 'ingredients',
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['commonName'] },
    { fields: ['incideName'] },
    { 
      fields: ['functionalCategories'], 
      using: 'gin',
      name: 'ingredients_functional_categories_gin'
    },
    { 
      fields: ['suitableForSkinTypes'], 
      using: 'gin',
      name: 'ingredients_skin_types_gin'
    },
    { fields: ['efficacyScore'] },
    { fields: ['safetyRating'] },
    { fields: ['ontologyUri'] }
  ]
});