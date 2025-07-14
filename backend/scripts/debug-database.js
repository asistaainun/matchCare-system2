console.log('🔍 Debugging database connection...\n');

// Test 1: Check if config file exists
console.log('📁 Checking config file paths...');
try {
  const fs = require('fs');
  
  const paths = [
    './src/config/database.js',
    './config/database.js', 
    './src/config/database/index.js',
    './src/config/index.js'
  ];
  
  paths.forEach(path => {
    if (fs.existsSync(path)) {
      console.log(`✅ Found: ${path}`);
    } else {
      console.log(`❌ Not found: ${path}`);
    }
  });
} catch (error) {
  console.log('❌ Error checking paths:', error.message);
}

// Test 2: Try different import paths
console.log('\n📥 Testing import paths...');

const importPaths = [
  '../src/config/database',
  '../config/database',
  '../src/config',
  '../src/config/database/index'
];

importPaths.forEach(path => {
  try {
    console.log(`🔄 Trying: require('${path}')`);
    const imported = require(path);
    console.log(`✅ Success! Exported keys:`, Object.keys(imported));
    
    if (imported.sequelize) {
      console.log(`✅ sequelize found in ${path}`);
    } else {
      console.log(`⚠️  sequelize not found in ${path}`);
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
});

// Test 3: Try importing from models
console.log('\n📦 Testing models import...');
try {
  const models = require('../src/models');
  console.log('✅ Models imported. Keys:', Object.keys(models));
  
  if (models.sequelize) {
    console.log('✅ sequelize found in models');
  } else {
    console.log('❌ sequelize not found in models');
  }
} catch (error) {
  console.log('❌ Models import failed:', error.message);
}