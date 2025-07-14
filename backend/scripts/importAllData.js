const { sequelize } = require('../src/config/database');
const dataImportService = require('../src/services/dataImportService');
const runMigrations = require('./runMigrations');
require('dotenv').config();

async function importAllData() {
  try {
    console.log('🚀 Starting COMPLETE MatchCare data import process...');
    console.log('🎯 This will import both Products + Ingredients + Relationships');
    console.log('⏱️  Expected time: 10-15 minutes\n');
    
    // Step 1: Run migrations
    console.log('📋 Step 1: Running database migrations...');
    await runMigrations();

    // Step 2: Test database connection
    console.log('\n🔗 Step 2: Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Step 3: Complete data import (ingredients + products + relationships)
    console.log('\n📦 Step 3: Starting complete data import...');
    const results = await dataImportService.importAll();
    
    // Step 4: Generate final statistics
    console.log('\n📈 Step 4: Generating final statistics...');
    const { Product, Ingredient, ProductIngredient } = require('../src/models');
    
    const finalStats = await Promise.all([
      Product.count(),
      Product.count({ where: { isActive: true } }),
      Ingredient.count(),
      Ingredient.count({ where: { isKeyIngredient: true } }),
      ProductIngredient.count()
    ]);

    console.log('\n🎉 COMPLETE IMPORT FINISHED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('📊 Final Database Statistics:');
    console.log(`   📦 Total Products: ${finalStats[0]}`);
    console.log(`   ✅ Active Products: ${finalStats[1]}`);
    console.log(`   🧪 Total Ingredients: ${finalStats[2]}`);
    console.log(`   ⭐ Key Ingredients: ${finalStats[3]}`);
    console.log(`   🔗 Product-Ingredient Links: ${finalStats[4]}`);
    console.log('=' .repeat(60));
    
    console.log('\n🎯 What you can do now:');
    console.log('   1. Test API endpoints: npm run test:api');
    console.log('   2. Generate stats: npm run stats');
    console.log('   3. Start your server: npm start');
    console.log('   4. Access products: http://localhost:5000/api/products');
    console.log('   5. Access ingredients: http://localhost:5000/api/ingredients');

    process.exit(0);

  } catch (error) {
    console.error('\n💥 Import process failed:', error);
    console.error('\n🔍 Troubleshooting steps:');
    console.error('1. Check CSV files exist:');
    console.error('   - backend/data/csv/final_corrected_matchcare_data.csv');
    console.error('   - backend/data/csv/matchcare_ultimate_cleaned.csv');
    console.error('2. Verify database connection in .env');
    console.error('3. Ensure PostgreSQL is running');
    console.error('4. Check available disk space');
    process.exit(1);
  }
}

if (require.main === module) {
  importAllData();
}

module.exports = importAllData;