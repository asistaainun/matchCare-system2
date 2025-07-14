const csv = require('csvtojson');
const { Product, Ingredient, ProductIngredient, sequelize } = require('../src/models');
const path = require('path');

class DataImporter {
  async importProductData() {
    console.log('🔄 Importing product data...');
    
    const productFile = path.join(__dirname, '../data/final_corrected_matchcare_data.csv');
    const products = await csv().fromFile(productFile);
    
    let imported = 0;
    const batch = [];
    
    for (const row of products) {
      try {
        const productData = {
          productName: row['Product Name'],
          brand: row['Brand'],
          productType: row['Product Type'],
          description: row['Description'],
          howToUse: row['How to Use'],
          ingredients: row['Ingredients'],
          imageUrls: row['Image URLs'] ? row['Image URLs'].split(',') : [],
          bpomNumber: row['BPOM Number'],
          mainCategory: row['Main_Category'],
          subcategory: row['Subcategory'],
          keyIngredients: row['Key_Ingredients'] ? row['Key_Ingredients'].split(',') : [],
          alcoholFree: row['alcohol_free'] === 'true',
          fragranceFree: row['fragrance_free'] === 'true',
          parabenFree: row['paraben_free'] === 'true',
          sulfateFree: row['sulfate_free'] === 'true',
          siliconeFree: row['silicone_free'] === 'true',
          isActive: true
        };
        
        batch.push(productData);
        
        if (batch.length >= 100) {
          await Product.bulkCreate(batch, { ignoreDuplicates: true });
          imported += batch.length;
          batch.length = 0;
          console.log(`✅ Imported ${imported} products...`);
        }
      } catch (error) {
        console.error(`❌ Error importing product: ${error.message}`);
      }
    }
    
    if (batch.length > 0) {
      await Product.bulkCreate(batch, { ignoreDuplicates: true });
      imported += batch.length;
    }
    
    console.log(`✅ Total products imported: ${imported}`);
  }

  async importIngredientData() {
    console.log('🔄 Importing ingredient data...');
    
    const ingredientFile = path.join(__dirname, '../data/matchcare_ultimate_cleaned.csv');
    const ingredients = await csv().fromFile(ingredientFile);
    
    let imported = 0;
    const batch = [];
    
    for (const row of ingredients) {
      try {
        const ingredientData = {
          name: row['name'],
          actualFunctions: row['actualFunctions'],
          functionalCategories: row['functionalCategories'] ? row['functionalCategories'].split(',') : [],
          keyIngredientTypes: row['keyIngredientTypes'],
          isKeyIngredient: row['isKeyIngredient'] === 'true',
          suitableForSkinTypes: row['suitableForSkinTypes'] ? row['suitableForSkinTypes'].split(',') : [],
          addressesConcerns: row['addressesConcerns'] ? row['addressesConcerns'].split(',') : [],
          providedBenefits: row['providedBenefits'] ? row['providedBenefits'].split(',') : [],
          pregnancySafe: row['pregnancySafe'] === 'true',
          sensitivities: row['sensitivities'],
          alcoholFree: row['alcoholFree'] === 'true',
          fragranceFree: row['fragranceFree'] === 'true',
          siliconeFree: row['siliconeFree'] === 'true',
          sulfateFree: row['sulfateFree'] === 'true',
          parabenFree: row['parabenFree'] === 'true',
          explanation: row['explanation'],
          whatItDoes: row['whatItDoes'],
          alternativeNames: row['alternativeNames'],
          url: row['url']
        };
        
        batch.push(ingredientData);
        
        if (batch.length >= 100) {
          await Ingredient.bulkCreate(batch, { ignoreDuplicates: true });
          imported += batch.length;
          batch.length = 0;
          console.log(`✅ Imported ${imported} ingredients...`);
        }
      } catch (error) {
        console.error(`❌ Error importing ingredient: ${error.message}`);
      }
    }
    
    if (batch.length > 0) {
      await Ingredient.bulkCreate(batch, { ignoreDuplicates: true });
      imported += batch.length;
    }
    
    console.log(`✅ Total ingredients imported: ${imported}`);
  }

  async linkProductIngredients() {
    console.log('🔄 Linking products with ingredients...');
    
    const products = await Product.findAll();
    const ingredients = await Ingredient.findAll();
    
    // Create ingredient name lookup
    const ingredientMap = new Map();
    ingredients.forEach(ing => {
      ingredientMap.set(ing.name.toLowerCase().trim(), ing.id);
      
      // Add alternative names to map
      if (ing.alternativeNames) {
        const altNames = ing.alternativeNames.split(',');
        altNames.forEach(alt => {
          ingredientMap.set(alt.toLowerCase().trim(), ing.id);
        });
      }
    });
    
    let linked = 0;
    
    for (const product of products) {
      try {
        const productIngredients = [];
        
        if (product.keyIngredients && product.keyIngredients.length > 0) {
          for (const keyIng of product.keyIngredients) {
            const trimmed = keyIng.toLowerCase().trim();
            const ingredientId = ingredientMap.get(trimmed);
            
            if (ingredientId) {
              productIngredients.push({
                productId: product.id,
                ingredientId: ingredientId,
                isKeyIngredient: true
              });
            }
          }
        }
        
        if (productIngredients.length > 0) {
          await ProductIngredient.bulkCreate(productIngredients, { 
            ignoreDuplicates: true 
          });
          linked += productIngredients.length;
        }
      } catch (error) {
        console.error(`❌ Error linking product ${product.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Total product-ingredient links created: ${linked}`);
  }

  async run() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');
      
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced');
      
      await this.importProductData();
      await this.importIngredientData();
      await this.linkProductIngredients();
      
      console.log('🎉 Data import completed successfully!');
    } catch (error) {
      console.error('❌ Import failed:', error);
    }
  }
}

// Run import
if (require.main === module) {
  new DataImporter().run();
}

module.exports = DataImporter;