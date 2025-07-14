// backend/scripts/add-ingredient-instances.js
const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../src/config/database');

async function addIngredientInstances() {
  console.log('🧪 Adding curated ingredient instances...');
  
  // Strategy: Use curated list of most important skincare ingredients
  const curatedIngredients = getCuratedIngredients();
  
  // Try to get additional data from database if available
  const databaseIngredients = await getIngredientsFromDatabase();
  
  // Combine and deduplicate
  const allIngredients = mergeIngredients(curatedIngredients, databaseIngredients);
  
  // Generate TTL content
  const instancesContent = generateIngredientTTL(allIngredients);
  
  // Read base ontology
  const basePath = path.join(__dirname, '../data/ontology/base_ontology.ttl');
  const baseContent = await fs.readFile(basePath, 'utf8');
  
  // Combine base + instances
  const completeContent = baseContent + '\n\n' + instancesContent;
  
  // Save enhanced ontology
  const outputPath = path.join(__dirname, '../data/ontology/ontology_with_ingredients.ttl');
  await fs.writeFile(outputPath, completeContent);
  
  console.log(`✅ Ontology with ingredients saved: ${outputPath}`);
  console.log(`📊 Total ingredients: ${allIngredients.length}`);
  
  return { outputPath, ingredientCount: allIngredients.length };
}

function getCuratedIngredients() {
  // Hand-picked list of most important skincare ingredients
  return [
    {
      name: 'HyaluronicAcid',
      label: 'Hyaluronic Acid',
      skinTypes: ['Dry', 'Normal', 'Sensitive'],
      concerns: ['Dryness', 'FineLines'],
      functions: ['Humectant'],
      benefits: ['Hydrating', 'SkinConditioning'],
      description: 'Powerful humectant that can hold up to 1000x its weight in water'
    },
    {
      name: 'Niacinamide',
      label: 'Niacinamide',
      skinTypes: ['Oily', 'Combination', 'Normal'],
      concerns: ['Acne', 'Pores', 'Oiliness'],
      functions: ['AntiInflammatory'],
      benefits: ['PoreMinimizing', 'AcneFighter'],
      description: 'Form of Vitamin B3 that regulates oil production and minimizes pores'
    },
    {
      name: 'Retinol',
      label: 'Retinol',
      skinTypes: ['Normal', 'Oily'],
      concerns: ['Wrinkles', 'FineLines', 'Acne', 'Texture'],
      functions: ['Exfoliant'],
      benefits: ['AntiAging', 'AcneFighter'],
      description: 'Vitamin A derivative that promotes cell turnover and collagen production'
    },
    {
      name: 'VitaminC',
      label: 'Vitamin C',
      skinTypes: ['Normal', 'Dry', 'Combination'],
      concerns: ['DarkSpots', 'Dullness'],
      functions: ['Antioxidant'],
      benefits: ['Brightening', 'AntiAging'],
      description: 'Potent antioxidant that brightens skin and protects against environmental damage'
    },
    {
      name: 'SalicylicAcid',
      label: 'Salicylic Acid',
      skinTypes: ['Oily', 'Combination'],
      concerns: ['Acne', 'Pores'],
      functions: ['Exfoliant'],
      benefits: ['AcneFighter', 'PoreMinimizing'],
      description: 'Beta-hydroxy acid that penetrates pores to remove oil and dead skin'
    },
    {
      name: 'Ceramides',
      label: 'Ceramides',
      skinTypes: ['Dry', 'Sensitive', 'Normal'],
      concerns: ['Dryness', 'Sensitivity'],
      functions: ['Emollient'],
      benefits: ['Hydrating', 'SkinConditioning'],
      description: 'Natural lipids that restore and maintain skin barrier function'
    },
    {
      name: 'Glycerin',
      label: 'Glycerin',
      skinTypes: ['Dry', 'Normal', 'Sensitive'],
      concerns: ['Dryness'],
      functions: ['Humectant'],
      benefits: ['Hydrating', 'SkinConditioning'],
      description: 'Gentle humectant that draws moisture to the skin'
    },
    {
      name: 'Peptides',
      label: 'Peptides',
      skinTypes: ['Normal', 'Dry'],
      concerns: ['Wrinkles', 'FineLines'],
      functions: ['AntiInflammatory'],
      benefits: ['AntiAging', 'SkinConditioning'],
      description: 'Amino acid chains that signal skin to produce more collagen'
    },
    {
      name: 'ZincOxide',
      label: 'Zinc Oxide',
      skinTypes: ['Oily', 'Sensitive'],
      concerns: ['Acne', 'Sensitivity'],
      functions: ['AntiInflammatory'],
      benefits: ['AcneFighter', 'SkinConditioning'],
      description: 'Mineral sunscreen that also has anti-inflammatory properties'
    },
    {
      name: 'AlphaArbutin',
      label: 'Alpha Arbutin',
      skinTypes: ['Normal', 'Combination'],
      concerns: ['DarkSpots'],
      functions: ['Antioxidant'],
      benefits: ['Brightening'],
      description: 'Gentle brightening agent that inhibits melanin production'
    }
  ];
}

async function getIngredientsFromDatabase() {
  try {
    console.log('🔍 Checking database for additional ingredients...');
    
    const [ingredients] = await sequelize.query(`
      SELECT DISTINCT 
        name,
        "suitableForSkinTypes",
        "addressesConcerns",
        "providedBenefits"
      FROM ingredients 
      WHERE 
        name IS NOT NULL 
        AND "suitableForSkinTypes" IS NOT NULL 
        AND array_length("suitableForSkinTypes", 1) > 0
      LIMIT 15
    `);
    
    console.log(`✅ Found ${ingredients.length} ingredients in database`);
    
    return ingredients.map(ing => ({
      name: sanitizeName(ing.name),
      label: ing.name,
      skinTypes: ing.suitableForSkinTypes || [],
      concerns: ing.addressesConcerns || [],
      benefits: ing.providedBenefits || [],
      functions: ['Emollient'], // Default function
      description: `Database ingredient: ${ing.name}`
    }));
    
  } catch (error) {
    console.log('⚠️ Database not available, using only curated ingredients');
    return [];
  }
}

function mergeIngredients(curated, database) {
  const merged = [...curated];
  const curatedNames = new Set(curated.map(ing => ing.label.toLowerCase()));
  
  // Add database ingredients that are not in curated list
  database.forEach(dbIng => {
    if (!curatedNames.has(dbIng.label.toLowerCase())) {
      merged.push(dbIng);
    }
  });
  
  return merged.slice(0, 25); // Limit to 25 total ingredients
}

function generateIngredientTTL(ingredients) {
  let content = `# ===== INGREDIENT INSTANCES =====
# Curated set of important skincare ingredients with semantic relationships

`;

  ingredients.forEach(ingredient => {
    content += `
:${ingredient.name} rdf:type :Ingredient ;
    rdfs:label "${ingredient.label}" ;
    :hasName "${ingredient.label}" ;
    :hasDescription "${ingredient.description}" ;
`;

    // Add skin type suitability
    ingredient.skinTypes.forEach(skinType => {
      content += `    :suitableFor :${skinType} ;\n`;
    });
    
    // Add concerns addressed
    ingredient.concerns.forEach(concern => {
      content += `    :treatsConcern :${concern} ;\n`;
    });
    
    // Add functions
    ingredient.functions.forEach(func => {
      content += `    :hasFunction :${func} ;\n`;
    });
    
    // Add benefits
    ingredient.benefits.forEach(benefit => {
      content += `    :providesBenefit :${benefit} ;\n`;
    });
    
    content += `    .\n`;
  });
  
  return content;
}

function sanitizeName(text) {
  if (!text) return '';
  return text
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/^[0-9]+/, '');
}

// Run generator
addIngredientInstances()
  .then(result => {
    console.log(`🎯 Ingredients added successfully!`);
    console.log(`📁 File: ${result.outputPath}`);
    console.log(`📊 Count: ${result.ingredientCount}`);
  })
  .catch(console.error)
  .finally(() => sequelize.close());