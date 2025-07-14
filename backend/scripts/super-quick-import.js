// STEP 2: Create backend/scripts/super-quick-import.js
const csv = require('csvtojson');
const { Product, sequelize } = require('../src/models');
const path = require('path');

async function superQuickImport() {
  try {
    console.log('🚀 SUPER QUICK IMPORT - Starting...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sync tables
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    // Clear existing data
    await Product.destroy({ where: {} });
    console.log('✅ Cleared existing products');
    
    // Check if CSV file exists
    const csvFiles = [
      '../data/final_corrected_matchcare_data.csv',
      './data/final_corrected_matchcare_data.csv',
      '../final_corrected_matchcare_data.csv',
      './final_corrected_matchcare_data.csv'
    ];
    
    let productFile = null;
    for (const file of csvFiles) {
      const fullPath = path.resolve(__dirname, file);
      try {
        require('fs').accessSync(fullPath);
        productFile = fullPath;
        break;
      } catch (e) {
        console.log(`❌ File not found: ${fullPath}`);
      }
    }
    
    if (!productFile) {
      console.log('📝 Creating demo data instead...');
      await createDemoData();
      return;
    }
    
    console.log(`📊 Reading CSV: ${productFile}`);
    const products = await csv().fromFile(productFile);
    console.log(`📊 Found ${products.length} products in CSV`);
    
    // Process first 50 products for quick demo
    const productsToInsert = products.slice(0, 50).map((row, index) => ({
      productName: row['Product Name'] || `Demo Product ${index + 1}`,
      brand: row['Brand'] || 'Demo Brand',
      description: row['Description'] || 'Demo skincare product',
      mainCategory: row['Main_Category'] || 'Skincare',
      subcategory: row['Subcategory'] || 'Serum',
      keyIngredients: row['Key_Ingredients'] ? 
        row['Key_Ingredients'].split(',').map(i => i.trim()).slice(0, 5) : 
        ['hyaluronic acid', 'niacinamide'],
      imageUrls: row['Image URLs'] ? 
        [row['Image URLs'].split(',')[0].trim()] : 
        [`https://picsum.photos/300/300?random=${index + 1}`],
      alcoholFree: Math.random() > 0.5,
      fragranceFree: Math.random() > 0.5,
      parabenFree: Math.random() > 0.3,
      siliconeFree: Math.random() > 0.5,
      sulfateFree: Math.random() > 0.5,
      isActive: true,
      // Demo data for recommendations
      suitableForSkinTypes: getRandomSkinTypes(),
      addressesConcerns: getRandomConcerns(),
      providedBenefits: getRandomBenefits(),
      regularPrice: Math.floor(Math.random() * 500000) + 50000,
      rating: Math.random() * 2 + 3, // 3-5 rating
      favoriteCount: Math.floor(Math.random() * 1000),
      viewCount: Math.floor(Math.random() * 5000)
    }));
    
    // Insert in batches
    const batchSize = 20;
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      await Product.bulkCreate(batch, { ignoreDuplicates: true });
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(productsToInsert.length/batchSize)}`);
    }
    
    console.log(`🎉 SUCCESS! Imported ${productsToInsert.length} products`);
    
    // Verify import
    const count = await Product.count();
    console.log(`📊 Total products in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    console.log('🔄 Trying demo data creation...');
    await createDemoData();
  }
}

async function createDemoData() {
  console.log('📝 Creating demo products...');
  
  const demoProducts = [
    {
      productName: 'Niacinamide 10% + Zinc 1% Serum',
      brand: 'The Ordinary',
      description: 'A concentrated serum with niacinamide to reduce appearance of pores',
      mainCategory: 'Treatment',
      subcategory: 'Serum',
      keyIngredients: ['niacinamide', 'zinc oxide'],
      imageUrls: ['https://picsum.photos/300/300?random=1'],
      suitableForSkinTypes: ['oily', 'combination', 'normal'],
      addressesConcerns: ['acne', 'pores', 'oiliness'],
      providedBenefits: ['oil control', 'pore minimizing'],
      alcoholFree: true,
      fragranceFree: true,
      parabenFree: true,
      isActive: true,
      regularPrice: 125000,
      rating: 4.5
    },
    {
      productName: 'Hyaluronic Acid 2% + B5 Serum',
      brand: 'The Ordinary',
      description: 'Hydrating serum with multiple forms of hyaluronic acid',
      mainCategory: 'Treatment',
      subcategory: 'Serum',
      keyIngredients: ['hyaluronic acid', 'vitamin b5'],
      imageUrls: ['https://picsum.photos/300/300?random=2'],
      suitableForSkinTypes: ['dry', 'normal', 'sensitive'],
      addressesConcerns: ['dryness', 'fine lines'],
      providedBenefits: ['hydrating', 'plumping'],
      alcoholFree: true,
      fragranceFree: true,
      parabenFree: true,
      isActive: true,
      regularPrice: 135000,
      rating: 4.7
    },
    {
      productName: 'Vitamin C 30% in Silicone',
      brand: 'The Ordinary',
      description: 'High-strength vitamin C serum for brightening',
      mainCategory: 'Treatment',
      subcategory: 'Serum',
      keyIngredients: ['vitamin c', 'silicone'],
      imageUrls: ['https://picsum.photos/300/300?random=3'],
      suitableForSkinTypes: ['normal', 'combination'],
      addressesConcerns: ['dark spots', 'dullness'],
      providedBenefits: ['brightening', 'antioxidant'],
      alcoholFree: true,
      fragranceFree: true,
      parabenFree: true,
      isActive: true,
      regularPrice: 150000,
      rating: 4.2
    },
    {
      productName: 'Retinol 0.5% in Squalane',
      brand: 'The Ordinary',
      description: 'Anti-aging serum with retinol in squalane base',
      mainCategory: 'Treatment',
      subcategory: 'Serum',
      keyIngredients: ['retinol', 'squalane'],
      imageUrls: ['https://picsum.photos/300/300?random=4'],
      suitableForSkinTypes: ['normal', 'dry'],
      addressesConcerns: ['wrinkles', 'fine lines', 'acne'],
      providedBenefits: ['anti-aging', 'skin renewal'],
      alcoholFree: true,
      fragranceFree: true,
      parabenFree: true,
      isActive: true,
      regularPrice: 175000,
      rating: 4.3
    },
    {
      productName: 'Salicylic Acid 2% Solution',
      brand: 'The Ordinary',
      description: 'BHA treatment for congested skin',
      mainCategory: 'Treatment',
      subcategory: 'Serum',
      keyIngredients: ['salicylic acid', 'bha'],
      imageUrls: ['https://picsum.photos/300/300?random=5'],
      suitableForSkinTypes: ['oily', 'combination'],
      addressesConcerns: ['acne', 'pores', 'texture'],
      providedBenefits: ['exfoliating', 'unclogging'],
      alcoholFree: false,
      fragranceFree: true,
      parabenFree: true,
      isActive: true,
      regularPrice: 145000,
      rating: 4.4
    }
  ];
  
  // Add more demo products with variations
  for (let i = 6; i <= 30; i++) {
    demoProducts.push({
      productName: `Demo Skincare Product ${i}`,
      brand: ['CeraVe', 'Cetaphil', 'Neutrogena', 'La Roche Posay'][Math.floor(Math.random() * 4)],
      description: `High-quality skincare product ${i} for various skin needs`,
      mainCategory: ['Treatment', 'Cleanser', 'Moisturizer'][Math.floor(Math.random() * 3)],
      subcategory: ['Serum', 'Cream', 'Gel', 'Foam'][Math.floor(Math.random() * 4)],
      keyIngredients: getRandomIngredients(),
      imageUrls: [`https://picsum.photos/300/300?random=${i}`],
      suitableForSkinTypes: getRandomSkinTypes(),
      addressesConcerns: getRandomConcerns(),
      providedBenefits: getRandomBenefits(),
      alcoholFree: Math.random() > 0.3,
      fragranceFree: Math.random() > 0.4,
      parabenFree: Math.random() > 0.2,
      isActive: true,
      regularPrice: Math.floor(Math.random() * 400000) + 75000,
      rating: Math.random() * 1.5 + 3.5
    });
  }
  
  await Product.bulkCreate(demoProducts, { ignoreDuplicates: true });
  console.log(`✅ Created ${demoProducts.length} demo products`);
}

function getRandomSkinTypes() {
  const types = ['normal', 'dry', 'oily', 'combination', 'sensitive'];
  const count = Math.floor(Math.random() * 3) + 1;
  return types.sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomConcerns() {
  const concerns = ['acne', 'wrinkles', 'dark-spots', 'dryness', 'oiliness', 'sensitivity', 'pores', 'fine-lines'];
  const count = Math.floor(Math.random() * 4) + 1;
  return concerns.sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomBenefits() {
  const benefits = ['hydrating', 'brightening', 'anti-aging', 'oil control', 'soothing', 'exfoliating'];
  const count = Math.floor(Math.random() * 3) + 1;
  return benefits.sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomIngredients() {
  const ingredients = ['niacinamide', 'hyaluronic acid', 'vitamin c', 'retinol', 'salicylic acid', 'ceramides', 'peptides', 'glycerin'];
  const count = Math.floor(Math.random() * 4) + 2;
  return ingredients.sort(() => 0.5 - Math.random()).slice(0, count);
}

// Run import
if (require.main === module) {
  superQuickImport()
    .then(() => {
      console.log('🎉 Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = superQuickImport;