module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define('UserProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    skinType: {
      type: DataTypes.ENUM('normal', 'dry', 'oily', 'combination', 'sensitive'),
      allowNull: false
    },
    skinConcerns: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    knownSensitivities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    preferredBrands: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    avoidedIngredients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    likedIngredients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  });

  return UserProfile;
};