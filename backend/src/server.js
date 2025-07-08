require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const sequelize = require('./config/database');
const ontologyService = require('./services/ontologyService');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be loaded
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://matchcare.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Static files - IMPORTANT: Add this before other middleware
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Image optimization endpoint (optional)
app.get('/api/images/optimize/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { width, height, quality = 80 } = req.query;
    
    const imagePath = path.join(__dirname, '../public/images/products', filename);
    
    if (!require('fs').existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Here you can add image optimization logic with Sharp.js
    // For now, just serve the original
    res.sendFile(imagePath);
  } catch (error) {
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    // Load ontology service
    await ontologyService.loadOntology();
    console.log('✅ Ontology service initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📸 Images served from: http://localhost:${PORT}/images/`);
      console.log(`🧠 Ontology loaded: ${ontologyService.isLoaded ? 'Yes' : 'No (using fallback)'}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;