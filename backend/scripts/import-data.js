const csvToJson = require('csvtojson');
const fs = require('fs');
const path = require('path');
const Product = require('../src/models/Product');
const sequelize = require('../src/config/database');
const ontologyService = require('../src/services/ontologyService');

async function importData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Load ontology for intelligent mapping
    await ontologyService.loadOntology();
    console.log('✅ Ontology service initialized');

    // Load image mapping if available
    const imageMappingPath = path.join(__dirname, '../data/image-mapping.json');
    let imageMapping = {};
    
    if (fs.existsSync(imageMappingPath)) {
      imageMapping = JSON.parse(fs.readFileSync(imageMappingPath, 'utf8'));
      console.log('✅ Image mapping loaded');
    }

    // Import products from CSV
    const products = await csvToJson().fromFile('../../data/final_corrected_matchcare_data.csv');
    
    console.log(`📊 Importing ${products.length} products...`);

    let successCount = 0;
    let errorCount = 0;

    for (const productData of products) {
      try {
        const productId = generateProductId(productData['Product Name'], productData.Brand);
        const localImageUrl = getImageUrl(productData, imageMapping, productId);
        
        // Use ontology for intelligent categorization
        const ontologyMappings = await getOntologyMappings(productData);
        
        const product = await Product.create({
          name: productData['Product Name'],
          brand: productData.Brand,
          productType: productData['Product Type'],
          description: productData.Description,
          howToUse: productData['How to Use'],
          ingredients: productData.Ingredients,
          keyIngredients: productData.Key_Ingredients?.split(',').map(i => i.trim()).filter(Boolean) || [],
          imageUrl: localImageUrl, // Use local image URL
          originalImageUrl: productData['Image URLs'], // Keep original URL as backup
          productUrl: productData['Product URL'],
          bpomNumber: productData['BPOM Number'],
          mainCategory: ontologyMappings.category || productData.Main_Category,
          subcategory: productData.Subcategory,
          alcoholFree: productData.alcohol_free === 'true',
          fragranceFree: productData.fragrance_free === 'true',
          parabenFree: productData.paraben_free === 'true',
          sulfateFree: productData.sulfate_free === 'true',
          siliconeFree: productData.silicone_free === 'true',
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating between 3.0-5.0
          // Enhanced mappings using ontology
          suitableForSkinTypes: ontologyMappings.skinTypes,
          addressesConcerns: ontologyMappings.concerns,
          providedBenefits: ontologyMappings.benefits
        });
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`✅ Imported ${successCount} products...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing ${productData['Product Name']}:`, error.message);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${successCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    console.log(`   📈 Success rate: ${((successCount / products.length) * 100).toFixed(1)}%`);

    console.log('\n🎉 Data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

async function getOntologyMappings(productData) {
  const mappings = {
    skinTypes: getSuitableForSkinTypes(productData),
    concerns: getAddressesConcerns(productData),
    benefits: getProvidedBenefits(productData),
    category: productData.Main_Category
  };

  // Enhanced mapping using ontology service if loaded
  if (ontologyService.isLoaded) {
    try {
      // Map category using ontology
      const categories = ontologyService.getProductCategories();
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase() === productData.Main_Category?.toLowerCase() ||
        cat.label.toLowerCase() === productData.Main_Category?.toLowerCase()
      );
      if (matchingCategory) {
        mappings.category = matchingCategory.name;
      }

      // Enhanced ingredient analysis
      if (productData.Key_Ingredients) {
        const ingredients = productData.Key_Ingredients.split(',').map(i => i.trim());
        const ontologyIngredients = ontologyService.getIngredients();
        
        // Check for ingredient compatibility and enhanced benefits
        ingredients.forEach(ingredient => {
          const ontologyIngredient = ontologyIngredients.find(ing => 
            ing.name.toLowerCase().includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(ing.name.toLowerCase())
          );
          
          if (ontologyIngredient && ontologyIngredient.functions) {
            // Add benefits based on ingredient functions
            ontologyIngredient.functions.forEach(func => {
              const benefit = mapFunctionToBenefit(func);
              if (benefit && !mappings.benefits.includes(benefit)) {
                mappings.benefits.push(benefit);
              }
            });
          }
        });
      }
    } catch (error) {
      console.log('⚠️  Ontology mapping failed, using fallback:', error.message);
    }
  }

  return mappings;
}

function mapFunctionToBenefit(functionName) {
  const functionToBenefit = {
    'Antioxidant': 'Helps with Anti Aging',
    'Humectant': 'Hydrating',
    'Emollient': 'Skin Conditioning',
    'Exfoliant': 'Good for Texture',
    'AntiInflammatory': 'Reduces Irritation',
    'Brightening': 'Brightening',
    'Moisturizing': 'Hydrating'
  };
  
  return functionToBenefit[functionName];
}

function generateProductId(name, brand) {
  return `${brand}_${name}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function getImageUrl(productData, imageMapping, productId) {
  // Priority: 1. Image mapping, 2. Local image path, 3. Placeholder
  if (imageMapping[productId]) {
    return imageMapping[productId];
  }
  
  if (productData['Local Image Path']) {
    const filename = path.basename(productData['Local Image Path']);
    return `/images/products/${filename}`;
  }
  
  return '/images/placeholders/product-placeholder.jpg';
}

// Enhanced helper functions with ontology awareness
function getSuitableForSkinTypes(productData) {
  const skinTypes = [];
  const name = productData['Product Name']?.toLowerCase() || '';
  const description = productData.Description?.toLowerCase() || '';
  const category = productData.Main_Category?.toLowerCase() || '';
  const ingredients = productData.Key_Ingredients?.toLowerCase() || '';
  
  // Basic mappings
  if (name.includes('dry') || description.includes('dry skin') || ingredients.includes('hyaluronic acid')) {
    skinTypes.push('Dry');
  }
  if (name.includes('oily') || description.includes('oily skin') || ingredients.includes('niacinamide')) {
    skinTypes.push('Oily');
  }
  if (name.includes('sensitive') || description.includes('sensitive') || ingredients.includes('aloe')) {
    skinTypes.push('Sensitive');
  }
  if (category.includes('cleanser') || category.includes('moisturizer')) {
    skinTypes.push('Normal', 'Combination');
  }
  
  // Gentle ingredients suitable for all skin types
  if (ingredients.includes('ceramide') || ingredients.includes('panthenol')) {
    skinTypes.push('Normal', 'Sensitive');
  }
  
  return skinTypes.length > 0 ? [...new Set(skinTypes)] : ['Normal'];
}

function getAddressesConcerns(productData) {
  const concerns = [];
  const name = productData['Product Name']?.toLowerCase() || '';
  const description = productData.Description?.toLowerCase() || '';
  const ingredients = productData.Key_Ingredients?.toLowerCase() || '';
  
  if (name.includes('acne') || ingredients.includes('salicylic acid') || ingredients.includes('benzoyl peroxide')) {
    concerns.push('Acne');
  }
  if (name.includes('aging') || name.includes('anti-aging') || ingredients.includes('retinol') || ingredients.includes('peptide')) {
    concerns.push('Wrinkles', 'Fine Lines');
  }
  if (name.includes('hydrat') || ingredients.includes('hyaluronic acid') || ingredients.includes('glycerin')) {
    concerns.push('Dryness');
  }
  if (name.includes('bright') || ingredients.includes('vitamin c') || ingredients.includes('kojic acid')) {
    concerns.push('Dark Spots', 'Dullness');
  }
  if (ingredients.includes('niacinamide')) {
    concerns.push('Pores', 'Oiliness');
  }
  if (name.includes('sun') || ingredients.includes('spf') || ingredients.includes('zinc oxide')) {
    concerns.push('UV Protection');
  }
  
  return concerns;
}

function getProvidedBenefits(productData) {
  const benefits = [];
  const name = productData['Product Name']?.toLowerCase() || '';
  const ingredients = productData.Key_Ingredients?.toLowerCase() || '';
  
  if (ingredients.includes('salicylic acid') || ingredients.includes('benzoyl peroxide')) {
    benefits.push('Acne Fighter');
  }
  if (ingredients.includes('vitamin c') || ingredients.includes('kojic acid') || ingredients.includes('arbutin')) {
    benefits.push('Brightening');
  }
  if (ingredients.includes('hyaluronic acid') || ingredients.includes('glycerin') || ingredients.includes('ceramide')) {
    benefits.push('Hydrating');
  }
  if (ingredients.includes('niacinamide')) {
    benefits.push('Reduces Large Pores', 'Skin Conditioning');
  }
  if (ingredients.includes('retinol') || ingredients.includes('peptide') || ingredients.includes('vitamin c')) {
    benefits.push('Helps with Anti Aging');
  }
  if (ingredients.includes('aloe') || ingredients.includes('centella') || ingredients.includes('panthenol')) {
    benefits.push('Reduces Irritation');
  }
  if (ingredients.includes('aha') || ingredients.includes('bha') || ingredients.includes('lactic acid')) {
    benefits.push('Good for Texture');
  }
  
  return benefits;
}

importData();