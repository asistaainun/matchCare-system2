console.log('🚀 Starting migration process...');
console.log('📂 Working directory:', process.cwd());

async function runMigration() {
  let sequelize;
  
  try {
    console.log('🔄 Loading database connection...');
    
    // Import database config
    const dbConfig = require('../src/config/database');
    console.log('✅ Database config loaded. Keys:', Object.keys(dbConfig));
    
    // Extract sequelize instance - handle different export formats
    if (dbConfig.sequelize) {
      sequelize = dbConfig.sequelize;
      console.log('✅ Using sequelize from dbConfig.sequelize');
    } else if (typeof dbConfig.authenticate === 'function') {
      // Database config exports sequelize directly
      sequelize = dbConfig;
      console.log('✅ Using sequelize from direct export');
    } else {
      throw new Error('Could not find sequelize instance in database config');
    }
    
    // Test connection
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    const { Sequelize } = require('sequelize');
    const queryInterface = sequelize.getQueryInterface();
    
    // Check existing tables
    console.log('📋 Checking existing tables...');
    const tables = await queryInterface.showAllTables();
    console.log('📋 Found tables:', tables.length > 0 ? tables.slice(0, 5) : 'No tables found');
    
    if (tables.includes('ProductIngredients')) {
      console.log('ℹ️  ProductIngredients table already exists');
      return;
    }
    
    // Check required tables
    const requiredTables = ['products', 'ingredients'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing required tables:', missingTables);
      console.log('💡 Run database setup first to create base tables');
      return;
    }
    
    console.log('🔨 Creating ProductIngredients table...');
    
    // Create table
    await queryInterface.createTable('ProductIngredients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE'
      },
      ingredientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'ingredients', key: 'id' },
        onDelete: 'CASCADE'
      },
      concentration: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    console.log('🔗 Adding unique index...');
    
    // Add unique index
    await queryInterface.addIndex('ProductIngredients', ['productId', 'ingredientId'], {
      unique: true,
      name: 'unique_product_ingredient'
    });
    
    console.log('✅ ProductIngredients migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Create database first: createdb matchcare_db');
    } else if (error.message.includes('connect')) {
      console.log('💡 Check PostgreSQL is running and credentials are correct');
    } else if (error.message.includes('already exists')) {
      console.log('ℹ️  Table already exists, that\'s fine!');
    }
  } finally {
    if (sequelize && typeof sequelize.close === 'function') {
      console.log('🔚 Closing database connection...');
      await sequelize.close();
    }
  }
}

runMigration();