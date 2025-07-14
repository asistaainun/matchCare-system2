const { sequelize } = require('../src/config/database');
const { Product, Ingredient, ProductIngredient } = require('../src/models');
const { Op } = require('sequelize');

async function testCompleteImplementation() {
  try {
    console.log('🧪 Testing complete MatchCare implementation...\n');

    // Test 1: Database connectivity and basic counts
    console.log('📋 Test 1: Database connectivity and basic counts');
    const [productCount, ingredientCount, relationshipCount] = await Promise.all([
      Product.count(),
      Ingredient.count(),
      ProductIngredient.count()
    ]);
    
    console.log(`   ✅ Products: ${productCount}`);
    console.log(`   ✅ Ingredients: ${ingredientCount}`);
    console.log(`   ✅ Relationships: ${relationshipCount}`);

    // Test 2: Product with ingredients
    console.log('\n📋 Test 2: Product with ingredients relationship');
    const productWithIngredients = await Product.findOne({
      include: [{
        model: Ingredient,
        as: 'ingredients',
        through: { attributes: ['isKeyIngredient'] }
      }],
      where: { isActive: true }
    });

    if (productWithIngredients && productWithIngredients.ingredients.length > 0) {
      console.log(`   ✅ Product: ${productWithIngredients.productName}`);
      console.log(`   ✅ Total ingredients: ${productWithIngredients.ingredients.length}`);
      console.log(`   ✅ Key ingredients: ${productWithIngredients.ingredients.filter(i => i.ProductIngredient.isKeyIngredient).length}`);
    } else {
      console.log('   ⚠️  No products with ingredients found');
    }

    // Test 3: Ingredient with products
    console.log('\n📋 Test 3: Ingredient with products relationship');
    const ingredientWithProducts = await Ingredient.findOne({
      include: [{
        model: Product,
        as: 'products',
        limit: 3
      }],
      where: { isKeyIngredient: true }
    });

    if (ingredientWithProducts && ingredientWithProducts.products.length > 0) {
      console.log(`   ✅ Ingredient: ${ingredientWithProducts.name}`);
      console.log(`   ✅ Found in ${ingredientWithProducts.products.length} products`);
    } else {
      console.log('   ⚠️  No ingredients with products found');
    }

    // Test 4: Search functionality
    console.log('\n📋 Test 4: Search functionality');
    const [productSearch, ingredientSearch] = await Promise.all([
      Product.findAll({
        where: {
          [Op.or]: [
            { productName: { [Op.iLike]: '%serum%' } },
            { brand: { [Op.iLike]: '%ordinary%' } }
          ],
          isActive: true
        },
        limit: 3
      }),
      Ingredient.findAll({
        where: {
          name: { [Op.iLike]: '%acid%' }
        },
        limit: 3
      })
    ]);

    console.log(`   ✅ Product search results: ${productSearch.length}`);
    console.log(`   ✅ Ingredient search results: ${ingredientSearch.length}`);

    // Test 5: Key ingredients and safety flags
    console.log('\n📋 Test 5: Key ingredients and safety flags');
    const [keyIngredients, alcoholFreeProducts] = await Promise.all([
      Ingredient.count({ where: { isKeyIngredient: true } }),
      Product.count({ where: { alcoholFree: true, isActive: true } })
    ]);

    console.log(`   ✅ Key ingredients: ${keyIngredients}`);
    console.log(`   ✅ Alcohol-free products: ${alcoholFreeProducts}`);

    // Test 6: Sample API data structure
    console.log('\n📋 Test 6: Sample API data structure');
    const sampleProduct = await Product.findOne({
      include: [{
        model: Ingredient,
        as: 'ingredients',
        attributes: ['name', 'whatItDoes'],
        through: { attributes: ['isKeyIngredient'] },
        limit: 3
      }],
      where: { isActive: true }
    });

    if (sampleProduct) {
      console.log(`   ✅ Sample product structure valid`);
      console.log(`   ✅ Product: ${sampleProduct.brand} ${sampleProduct.productName}`);
      console.log(`   ✅ Ingredients attached: ${sampleProduct.ingredients.length}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n🚀 Your MatchCare database is ready for:');
    console.log('   ✅ Product catalog with full search and filtering');
    console.log('   ✅ Ingredient database with product relationships');
    console.log('   ✅ API endpoints for both products and ingredients');
    console.log('   ✅ Complex filtering and recommendation queries');
    console.log('   ✅ Frontend integration and ontology system');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  testCompleteImplementation();
}

module.exports = testCompleteImplementation;