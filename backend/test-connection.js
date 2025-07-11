// Simpan file ini sebagai: backend/test-connection.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  console.log('🔧 Testing PostgreSQL connection...');
  console.log('='.repeat(50));
  
  console.log('📋 Environment Variables:');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***HIDDEN***' : 'NOT SET'}`);
  console.log('='.repeat(50));

  const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test query
    const result = await sequelize.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result[0][0].version);
    
    // Test database info
    const dbInfo = await sequelize.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        session_user as session_user
    `);
    console.log('🗄️  Database Info:', dbInfo[0][0]);
    
    await sequelize.close();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 Password authentication failed. Please check:');
      console.log('1. User exists: psql -c "\\du" -U postgres');
      console.log('2. Password is correct in .env file');
      console.log('3. Run: ALTER USER matchcare_user WITH PASSWORD \'your_password\';');
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n🔧 Database does not exist. Please run:');
      console.log('CREATE DATABASE matchcare_db;');
    }
    
    if (error.message.includes('connection refused')) {
      console.log('\n🔧 Connection refused. Please check:');
      console.log('1. PostgreSQL is running: pg_ctl status');
      console.log('2. Port 5432 is correct');
      console.log('3. Host localhost is accessible');
    }
  }
}

testConnection();