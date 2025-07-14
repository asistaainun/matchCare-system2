const csvtojson = require('csvtojson');
const path = require('path');
const fs = require('fs').promises;
const { Product, Ingredient, ProductIngredient } = require('../models');
const { Op } = require('sequelize');

class DataImportService {
  constructor() {
    this.productsFile = path.join(__dirname, '../../data/csv/final_corrected_matchcare_data.csv');
    this.ingredientsFile = path.join(__dirname, '../../data/csv/matchcare_ultimate_cleaned.csv');
    this.batchSize = 100;
    
    this.stats = {
      products: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      ingredients: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      relationships: { created: 0, errors: 0 }
    };
  }

  // MAIN IMPORT METHOD
  async importAll() {
    try {
      console.log('🚀 Starting complete MatchCare data import...\n');
      
      // Step 1: Import Ingredients first (products will reference them)
      console.log('📦 Phase 1: Importing Ingredients...');
      await this.importIngredients();
      
      // Step 2: Import Products
      console.log('\n📦 Phase 2: Importing Products...');
      await this.importProducts();
      
      // Step 3: Create Product-Ingredient relationships
      console.log('\n🔗 Phase 3: Creating Product-Ingredient relationships...');
      await this.linkProductsWithIngredients();
      
      console.log('\n🎉 Complete data import finished!');
      this.printFinalStats();
      
      return this.stats;
      
    } catch (error) {
      console.error('❌ Import process failed:', error);
      throw error;
    }
  }

  // INGREDIENTS IMPORT
  async importIngredients() {
    try {
      console.log('🧪 Loading ingredients CSV...');
      
      const fs_sync = require('fs');
      if (!fs_sync.existsSync(this.ingredientsFile)) {
        throw new Error(`Ingredients file not found: ${this.ingredientsFile}`);
      }

      const jsonArray = await csvtojson().fromFile(this.ingredientsFile);
      console.log(`📊 Found ${jsonArray.length} ingredients to process`);

      // Process in batches
      for (let i = 0; i < jsonArray.length; i += this.batchSize) {
        const batch = jsonArray.slice(i, i + this.batchSize);
        await this.processIngredientBatch(batch);
        
        if (i % 1000 === 0) {
          console.log(`📦 Processed ${i} ingredients...`);
        }
      }

      console.log('✅ Ingredients import completed');
      
    } catch (error) {
      console.error('❌ Error importing ingredients:', error);
      throw error;
    }
  }

  async processIngredientBatch(batch) {
    const promises = batch.map(row => this.processIngredient(row));
    await Promise.allSettled(promises);
  }

  async processIngredient(row) {
    try {
      const ingredientName = (row.name || '').trim();
      
      if (!ingredientName || ingredientName.length < 2) {
        this.stats.ingredients.skipped++;
        return;
      }

      // Check if exists
      const existingIngredient = await Ingredient.findOne({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: ingredientName } },
            { slug: this.generateSlug(ingredientName) }
          ]
        }
      });

      const ingredientData = this.mapCsvToIngredient(row);

      if (existingIngredient) {
        await existingIngredient.update(ingredientData);
        this.stats.ingredients.updated++;
      } else {
        await Ingredient.create(ingredientData);
        this.stats.ingredients.imported++;
      }

    } catch (error) {
      console.error(`❌ Error processing ingredient "${row.name}":`, error.message);
      this.stats.ingredients.errors++;
    }
  }

  mapCsvToIngredient(row) {
    return {
      name: (row.name || '').trim(),
      slug: this.generateSlug(row.name),
      alternativeNames: this.parseArray(row.alternativeNames),
      description: row.explanation || row.benefit || '',
      whatItDoes: row.whatItDoes || '',
      actualFunctions: this.parseArray(row.actualFunctions),
      functionalCategories: this.parseArray(row.functionalCategories),
      keyIngredientTypes: this.parseArray(row.keyIngredientTypes),
      isKeyIngredient: this.parseBoolean(row.isKeyIngredient),
      suitableForSkinTypes: this.parseArray(row.suitableForSkinTypes),
      addressesConcerns: this.parseArray(row.addressesConcerns),
      providedBenefits: this.parseArray(row.providedBenefits),
      pregnancySafe: row.pregnancySafe || '',
      sensitivities: this.parseArray(row.sensitivities),
      alcoholFree: this.parseBoolean(row.alcoholFree),
      fragranceFree: this.parseBoolean(row.fragranceFree),
      siliconeFree: this.parseBoolean(row.siliconeFree),
      sulfateFree: this.parseBoolean(row.sulfateFree),
      parabenFree: this.parseBoolean(row.parabenFree),
      explanation: row.explanation || '',
      benefit: row.benefit || '',
      safety: row.safety || '',
      url: row.url || '',
      isMultifunctional: this.parseBoolean(row.isMultifunctional),
      hasComprehensiveData: this.parseBoolean(row.hasComprehensiveData),
      concentrationGuidelines: this.parseFloat(row.concentrationGuidelines),
      interactionWarnings: row.interactionWarnings || '',
      skinTypeNotes: row.skinTypeNotes || '',
      popularityScore: this.calculateIngredientPopularityScore(row),
      efficacyRating: this.parseFloat(row.efficacyRating),
      safetyRating: this.parseFloat(row.safetyRating)
    };
  }

  // PRODUCTS IMPORT
  async importProducts() {
    try {
      console.log('📦 Loading products CSV...');
      
      const fs_sync = require('fs');
      if (!fs_sync.existsSync(this.productsFile)) {
        throw new Error(`Products file not found: ${this.productsFile}`);
      }

      const jsonArray = await csvtojson().fromFile(this.productsFile);
      console.log(`📊 Found ${jsonArray.length} products to process`);

      // Process in batches
      for (let i = 0; i < jsonArray.length; i += this.batchSize) {
        const batch = jsonArray.slice(i, i + this.batchSize);
        await this.processProductBatch(batch);
        
        if (i % 500 === 0) {
          console.log(`📦 Processed ${i} products...`);
        }
      }

      console.log('✅ Products import completed');
      
    } catch (error) {
      console.error('❌ Error importing products:', error);
      throw error;
    }
  }

  async processProductBatch(batch) {
    const promises = batch.map(row => this.processProduct(row));
    await Promise.allSettled(promises);
  }

  async processProduct(row) {
    try {
      const productName = (row['Product Name'] || '').trim();
      const brand = (row['Brand'] || '').trim();
      
      if (!productName || !brand) {
        this.stats.products.skipped++;
        return;
      }

      // Check if exists
      const existingProduct = await Product.findOne({
        where: {
          productName: { [Op.iLike]: productName },
          brand: { [Op.iLike]: brand }
        }
      });

      const productData = this.mapCsvToProduct(row);

      if (existingProduct) {
        await existingProduct.update(productData);
        this.stats.products.updated++;
      } else {
        await Product.create(productData);
        this.stats.products.imported++;
      }

    } catch (error) {
      console.error(`❌ Error processing product "${row['Product Name']}":`, error.message);
      this.stats.products.errors++;
    }
  }

  mapCsvToProduct(row) {
    return {
      productUrl: row['Product URL'] || '',
      productName: (row['Product Name'] || '').trim(),
      brand: (row['Brand'] || '').trim(),
      productType: row['Product Type'] || '',
      description: row['Description'] || '',
      howToUse: row['How to Use'] || '',
      ingredients: row['Ingredients'] || '',
      keyIngredients: this.parseArray(row['Key_Ingredients']),
      imageUrls: this.parseArray(row['Image URLs']),
      localImagePath: row['Local Image Path'] || '',
      bpomNumber: row['BPOM Number'] || '',
      mainCategory: row['Main_Category'] || '',
      subcategory: row['Subcategory'] || '',
      categorizationConfidence: this.parseInt(row['Categorization_Confidence']) || 0,
      alcoholFree: this.parseBoolean(row['alcohol_free']),
      fragranceFree: this.parseBoolean(row['fragrance_free']),
      parabenFree: this.parseBoolean(row['paraben_free']),
      sulfateFree: this.parseBoolean(row['sulfate_free']),
      siliconeFree: this.parseBoolean(row['silicone_free']),
      // Initialize empty arrays for enhanced fields
      suitableForSkinTypes: [],
      addressesConcerns: [],
      providedBenefits: [],
      tags: this.generateProductTags(row),
      metaTitle: `${row['Brand']} ${row['Product Name']}`.trim(),
      metaDescription: (row['Description'] || '').substring(0, 160),
      isActive: true,
      isFeatured: false,
      isVerified: false
    };
  }

  // PRODUCT-INGREDIENT LINKING
  async linkProductsWithIngredients() {
    try {
      console.log('🔗 Starting product-ingredient linking...');
      
      const products = await Product.findAll({
        attributes: ['id', 'ingredients', 'keyIngredients']
      });

      console.log(`📊 Found ${products.length} products to link`);

      for (const product of products) {
        try {
          await this.linkSingleProduct(product);
          this.stats.relationships.created++;
        } catch (error) {
          console.error(`❌ Error linking product ${product.id}:`, error.message);
          this.stats.relationships.errors++;
        }
      }

      console.log('✅ Product-ingredient linking completed');
      
    } catch (error) {
      console.error('❌ Error in linking process:', error);
      throw error;
    }
  }

  async linkSingleProduct(product) {
    // Extract ingredients from text and key ingredients array
    const allIngredients = this.extractIngredientNames(
      product.ingredients, 
      Array.isArray(product.keyIngredients) ? product.keyIngredients : []
    );
    
    if (allIngredients.length === 0) return;

    // Find matching ingredients in database
    const matchedIngredients = await this.findMatchingIngredients(allIngredients);

    // Create links
    for (const [index, ingredientName] of allIngredients.entries()) {
      const ingredient = matchedIngredients.find(ing => 
        this.isIngredientMatch(ing.name, ingredientName) ||
        ing.alternativeNames.some(alt => this.isIngredientMatch(alt, ingredientName))
      );

      if (ingredient) {
        await ProductIngredient.findOrCreate({
          where: {
            productId: product.id,
            ingredientId: ingredient.id
          },
          defaults: {
            position: index + 1,
            isKeyIngredient: (product.keyIngredients || []).some(key => 
              this.isIngredientMatch(key, ingredientName)
            )
          }
        });
      }
    }
  }

  // UTILITY METHODS
  extractIngredientNames(ingredientsText, keyIngredients = []) {
    const ingredients = new Set();
    
    // Add key ingredients first
    keyIngredients.forEach(ingredient => {
      if (ingredient && ingredient.trim()) {
        ingredients.add(ingredient.trim());
      }
    });

    // Extract from text
    if (ingredientsText) {
      const extracted = ingredientsText
        .split(/[,;]+/)
        .map(ingredient => ingredient.trim())
        .filter(ingredient => ingredient.length > 2)
        .slice(0, 50); // Limit for performance
      
      extracted.forEach(ingredient => ingredients.add(ingredient));
    }

    return Array.from(ingredients);
  }

  async findMatchingIngredients(ingredientNames) {
    const searchTerms = ingredientNames.map(name => name.toLowerCase());
    
    return await Ingredient.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: { [Op.any]: searchTerms.map(term => `%${term}%`) } } },
          { alternativeNames: { [Op.iLike]: { [Op.any]: searchTerms.map(term => `%${term}%`) } } }
        ]
      }
    });
  }

  isIngredientMatch(dbIngredient, csvIngredient) {
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const db = normalize(dbIngredient);
    const csv = normalize(csvIngredient);
    
    // Exact match
    if (db === csv) return true;
    
    // Partial match
    if (db.includes(csv) || csv.includes(db)) return true;
    
    // Common variations
    const variations = {
      'hyaluronicacid': ['sodiumhyaluronate', 'hyaluronate'],
      'vitaminc': ['ascorbicacid', 'lascorbicacid'],
      'vitamine': ['tocopherol', 'tocopherylacetate'],
      'salicylicacid': ['bha', 'betahydroxyacid'],
      'niacinamide': ['nicotinamide', 'vitaminb3']
    };

    for (const [main, alts] of Object.entries(variations)) {
      if ((db.includes(main) || alts.some(alt => db.includes(alt))) &&
          (csv.includes(main) || alts.some(alt => csv.includes(alt)))) {
        return true;
      }
    }

    return false;
  }

  generateSlug(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  parseArray(value) {
    if (!value) return [];
    
    try {
      if (value.startsWith('[') && value.endsWith(']')) {
        return JSON.parse(value);
      }
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } catch {
      return [];
    }
  }

  parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }
    return null;
  }

  parseInt(value) {
    if (!value || value === '') return null;
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }

  parseFloat(value) {
    if (!value || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  calculateIngredientPopularityScore(row) {
    let score = 0;
    if (row.isKeyIngredient === 'true') score += 40;
    if (row.hasDetailedInfo === 'true') score += 20;
    if (row.isMultifunctional === 'true') score += 15;
    if (row.hasComprehensiveData === 'true') score += 15;
    const functions = this.parseArray(row.actualFunctions);
    score += Math.min(10, functions.length * 2);
    return Math.min(100, score);
  }

  generateProductTags(row) {
    const tags = [];
    if (row['Brand']) tags.push(row['Brand']);
    if (row['Main_Category']) tags.push(row['Main_Category']);
    if (row['Product Type']) tags.push(row['Product Type']);
    if (this.parseBoolean(row['alcohol_free'])) tags.push('Alcohol Free');
    if (this.parseBoolean(row['fragrance_free'])) tags.push('Fragrance Free');
    return [...new Set(tags)];
  }

  printFinalStats() {
    console.log('\n📊 FINAL IMPORT STATISTICS');
    console.log('=' .repeat(50));
    console.log('🧪 Ingredients:');
    console.log(`   📥 Imported: ${this.stats.ingredients.imported}`);
    console.log(`   🔄 Updated: ${this.stats.ingredients.updated}`);
    console.log(`   ⏭️  Skipped: ${this.stats.ingredients.skipped}`);
    console.log(`   ❌ Errors: ${this.stats.ingredients.errors}`);
    
    console.log('\n📦 Products:');
    console.log(`   📥 Imported: ${this.stats.products.imported}`);
    console.log(`   🔄 Updated: ${this.stats.products.updated}`);
    console.log(`   ⏭️  Skipped: ${this.stats.products.skipped}`);
    console.log(`   ❌ Errors: ${this.stats.products.errors}`);
    
    console.log('\n🔗 Relationships:');
    console.log(`   🔗 Created: ${this.stats.relationships.created}`);
    console.log(`   ❌ Errors: ${this.stats.relationships.errors}`);
    console.log('=' .repeat(50));
  }
}

module.exports = new DataImportService();