const GuestSession = sequelize.define('GuestSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  },
  
  // Session Metadata
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fingerprint: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Browser fingerprint for session tracking'
  },
  
  // Profile Data (mirrors UserProfile for guests)
  profileData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Complete profile data from quiz'
  },
  semanticAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'Semantic analysis results for guest'
  },
  quickRecommendations: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Quick product recommendations for guest'
  },
  
  // Session Activity
  viewedProducts: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
    comment: 'Products viewed during session'
  },
  searchQueries: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Search queries performed during session'
  },
  interactionEvents: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'User interactions during session'
  },
  
  // Session Management
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    allowNull: false
  },
  
  // Conversion Tracking
  convertedToUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User ID if guest converted to account'
  },
  conversionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Analytics
  referralSource: {
    type: DataTypes.STRING,
    allowNull: true
  },
  quizCompletionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time to complete quiz in seconds'
  },
  totalSessionTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total time spent in session (seconds)'
  },
  pageViews: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'guest_sessions',
  indexes: [
    { fields: ['sessionId'], unique: true },
    { fields: ['isActive'] },
    { fields: ['expiresAt'] },
    { fields: ['ipAddress'] },
    { fields: ['convertedToUserId'] },
    { fields: ['createdAt'] }
  ],
  
  // Auto-cleanup expired sessions
  hooks: {
    beforeCreate: (session) => {
      // Set expiration based on activity type
      if (session.profileData && Object.keys(session.profileData).length > 0) {
        // Extended expiration for quiz completers
        session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
    }
  }
});