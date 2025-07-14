const { sequelize } = require('../src/config/database');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    const umzug = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../migrations/*.js'),
      },
      context: { 
        queryInterface: sequelize.getQueryInterface(), 
        Sequelize: require('sequelize') 
      },
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    const pending = await umzug.pending();
    console.log(`📋 Found ${pending.length} pending migrations`);

    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    const executed = await umzug.up();
    console.log(`✅ Executed ${executed.length} migrations:`);
    executed.forEach(migration => {
      console.log(`   - ${migration.name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migrations completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runMigrations;