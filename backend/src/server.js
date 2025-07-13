const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Database and models
const { connectDB } = require('./config/database');
const models = require('./models');

// Services (initialize semantic services)
const ontologyService = require('./services/ontologyService');
const semanticRecommendationEngine = require('./services/semanticRecommendationEngine');

// Routes
const productRoutes = require('./routes/products');
const ingredientRoutes = require('./routes/ingredients');
const userRoutes = require('./routes/users');
const quizRoutes = require('./routes/quiz'); // Enhanced quiz routes
const recommendationRoutes = require('./routes/recommendations');
const guestRoutes = require('./routes/guest');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// ===== SECURITY & OPTIMIZATION MIDDLEWARE =====

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000']
    }
  }
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use('/api/', rateLimiter);

// ===== CORS CONFIGURATION =====

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ===== BODY PARSING MIDDLEWARE =====

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== STATIC FILE SERVING =====

// Serve product images
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1h'
}));

// ===== HEALTH CHECK ENDPOINTS =====

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Comprehensive system health check
app.get('/api/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      version: process.env.npm_package_version || '2.0-semantic',
      environment: process.env.NODE_ENV
    };

    // Database health check
    try {
      await models.sequelize.authenticate();
      const dbStats = await models.sequelize.query('SELECT version()', { type: models.sequelize.QueryTypes.SELECT });
      healthCheck.services.database = {
        status: 'healthy',
        version: dbStats[0]?.version?.split(' ')[0] || 'unknown'
      };
    } catch (error) {
      healthCheck.services.database = {
        status: 'unhealthy',
        error: error.message
      };
      healthCheck.status = 'degraded';
    }

    // Ontology service health check
    try {
      const ontologyStats = ontologyService.getStats();
      healthCheck.services.ontology = {
        status: ontologyStats.loaded ? 'loaded' : 'not-loaded',
        method: ontologyStats.method,
        ingredients: ontologyStats.ingredients,
        cacheSize: ontologyStats.cacheSize
      };
    } catch (error) {
      healthCheck.services.ontology = {
        status: 'error',
        error: error.message
      };
    }

    // Semantic recommendation engine health check
    try {
      const engineStats = semanticRecommendationEngine.getStats();
      healthCheck.services.recommendationEngine = {
        status: 'healthy',
        cacheSize: engineStats.cacheSize,
        ontologyEnabled: engineStats.ontologyStats?.loaded || false
      };
    } catch (error) {
      healthCheck.services.recommendationEngine = {
        status: 'error',
        error: error.message
      };
    }

    // File system health check
    try {
      const fs = require('fs').promises;
      await fs.access(path.join(__dirname, 'public/images'));
      healthCheck.services.fileSystem = { status: 'healthy' };
    } catch (error) {
      healthCheck.services.fileSystem = {
        status: 'unhealthy',
        error: 'Image directory not accessible'
      };
    }

    // Overall status determination
    const unhealthyServices = Object.values(healthCheck.services)
      .filter(service => service.status === 'unhealthy' || service.status === 'error');
    
    if (unhealthyServices.length > 0) {
      healthCheck.status = unhealthyServices.length > 1 ? 'unhealthy' : 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Ontology-specific health check
app.get('/api/health/ontology', async (req, res) => {
  try {
    const stats = ontologyService.getStats();
    const sampleAnalysis = await ontologyService.getSemanticRecommendations({
      skinType: 'normal',
      skinConcerns: ['acne'],
      knownSensitivities: []
    });

    res.json({
      status: 'OK',
      ontologyLoaded: stats.loaded,
      method: stats.method,
      stats,
      sampleAnalysis: {
        method: sampleAnalysis.method,
        confidence: sampleAnalysis.confidence,
        ingredientCount: sampleAnalysis.recommendedIngredients?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// ===== SEMANTIC SERVICES INITIALIZATION =====

async function initializeSemanticServices() {
  console.log('🧠 Initializing semantic services...');
  
  try {
    // Initialize ontology service
    console.log('📚 Loading ontology service...');
    await ontologyService.loadOntology();
    
    const ontologyStats = ontologyService.getStats();
    console.log('✅ Ontology service initialized:', {
      method: ontologyStats.method,
      ingredients: ontologyStats.ingredients,
      loaded: ontologyStats.loaded
    });

    // Warm up semantic recommendation engine
    console.log('🔧 Warming up recommendation engine...');
    // No explicit initialization needed for the engine
    
    console.log('🚀 All semantic services initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize semantic services:', error);
    console.log('⚠️  System will continue with fallback functionality');
    return false;
  }
}

// ===== API ROUTES =====

app.use('/api/products', productRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quiz', quizRoutes); // Enhanced semantic quiz routes
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/guest', guestRoutes);

// ===== DEVELOPMENT ROUTES =====

if (process.env.NODE_ENV === 'development') {
  // Development-only endpoints for testing
  app.post('/api/dev/reload-ontology', async (req, res) => {
    try {
      console.log('🔄 Reloading ontology service...');
      ontologyService.clearCache();
      await ontologyService.loadOntology();
      
      const stats = ontologyService.getStats();
      res.json({
        success: true,
        message: 'Ontology reloaded successfully',
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reload ontology',
        error: error.message
      });
    }
  });

  app.get('/api/dev/stats', async (req, res) => {
    try {
      const stats = {
        ontology: ontologyService.getStats(),
        recommendationEngine: semanticRecommendationEngine.getStats(),
        database: {
          connected: models.sequelize.connectionManager.hasConnections(),
          dialect: models.sequelize.getDialect()
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform
        }
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  });
}

// ===== ERROR HANDLING =====

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Clear caches
    ontologyService.clearCache();
    semanticRecommendationEngine.clearCache();
    
    // Close database connections
    await models.sequelize.close();
    console.log('✅ Database connections closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// ===== SERVER STARTUP =====

async function startServer() {
  try {
    console.log('🚀 Starting MatchCare Backend Server...');
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`📋 Version: ${process.env.npm_package_version || '2.0-semantic'}`);

    // Connect to database
    console.log('📊 Connecting to database...');
    await connectDB();

    // Initialize semantic services
    const semanticServicesReady = await initializeSemanticServices();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\n🎉 MatchCare Backend Server running on port ${PORT}`);
      console.log(`📊 Database: PostgreSQL`);
      console.log(`🖼️  Static files: /images/products/`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
      console.log(`🧠 Semantic services: ${semanticServicesReady ? 'Ready' : 'Fallback mode'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 Ontology check: http://localhost:${PORT}/api/health/ontology`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🛠️  Dev endpoints: http://localhost:${PORT}/api/dev/`);
      }
      
      console.log('\n✅ Server startup completed successfully\n');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;