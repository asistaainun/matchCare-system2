const { Product, Ingredient, ProductIngredient } = require('../models');
const { ontologyService } = require('./ontologyService');
const { Op } = require('sequelize');

class EnhancedRecommendationService {
  
  async getPersonalizedRecommendations(userProfile, options = {}) {
    const { skinType, skinConcerns, knownSensitivities, preferredBrands } = userProfile;
    const { limit = 20, category, priceRange } = options;
    
    console.log('🧠 Getting personalized recommendations for:', userProfile);
    
    try {
      // 1. Get semantic ingredient recommendations from ontology
      const semanticRecs = await ontologyService.getSemanticRecommendations({
        skinType,
        skinConcerns: skinConcerns || [],
        knownSensitivities: knownSensitivities || []
      });
      
      console.log('📊 Semantic analysis result:', {
        method: semanticRecs.method,
        ingredientCount: semanticRecs.recommendedIngredients?.length || 0
      });
      
      // 2. Build product query based on semantic insights
      const productQuery = this.buildProductQuery(semanticRecs, {
        category,
        brands: preferredBrands,
        sensitivities: knownSensitivities
      });
      
      // 3. Get candidate products
      const products = await Product.findAll({
        ...productQuery,
        include: [{
          model: Ingredient,
          as: 'ingredients',
          through: { attributes: ['isKeyIngredient'] }
        }],
        limit: limit * 2 // Get more candidates for better scoring
      });
      
      console.log(`📦 Found ${products.length} candidate products`);
      
      // 4. Score products using semantic analysis
      const scoredProducts = await this.scoreProducts(
        products, 
        userProfile, 
        semanticRecs
      );
      
      // 5. Sort and limit results
      const recommendations = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return {
        recommendations,
        semanticInsights: {
          method: semanticRecs.method,
          topIngredients: semanticRecs.recommendedIngredients?.slice(0, 5) || [],
          reasoning: semanticRecs.reasoning
        },
        userProfile: {
          skinType,
          concerns: skinConcerns?.length || 0,
          sensitivities: knownSensitivities?.length || 0
        }
      };
      
    } catch (error) {
      console.error('❌ Recommendation error:', error);
      
      // Fallback to simple recommendations
      return this.getFallbackRecommendations(userProfile, options);
    }
  }
  
  buildProductQuery(semanticRecs, options) {
    const where = { isActive: true };
    const topIngredients = semanticRecs.recommendedIngredients
      ?.slice(0, 10)
      .map(rec => rec.ingredient) || [];
    
    // Category filter
    if (options.category) {
      where[Op.or] = [
        { mainCategory: { [Op.iLike]: `%${options.category}%` } },
        { subcategory: { [Op.iLike]: `%${options.category}%` } }
      ];
    }
    
    // Brand preference
    if (options.brands && options.brands.length > 0) {
      where.brand = { [Op.in]: options.brands };
    }
    
    // Safety filters for sensitivities
    if (options.sensitivities && options.sensitivities.length > 0) {
      options.sensitivities.forEach(sensitivity => {
        switch (sensitivity.toLowerCase()) {
          case 'fragrance':
            where.fragranceFree = true;
            break;
          case 'alcohol':
            where.alcoholFree = true;
            break;
          case 'paraben':
            where.parabenFree = true;
            break;
          case 'sulfate':
            where.sulfateFree = true;
            break;
          case 'silicone':
            where.siliconeFree = true;
            break;
        }
      });
    }
    
    return {
      where,
      order: [['createdAt', 'DESC']]
    };
  }
  
  async scoreProducts(products, userProfile, semanticRecs) {
    const topSemanticIngredients = semanticRecs.recommendedIngredients
      ?.slice(0, 10)
      .map(rec => rec.ingredient.toLowerCase()) || [];
    
    return products.map(product => {
      const scores = this.calculateProductScore(
        product, 
        userProfile, 
        topSemanticIngredients
      );
      
      return {
        ...product.toJSON(),
        score: scores.totalScore,
        scoreBreakdown: scores.breakdown,
        matchReasons: scores.reasons
      };
    });
  }
  
  calculateProductScore(product, userProfile, topSemanticIngredients) {
    const { skinType, skinConcerns } = userProfile;
    let totalScore = 0;
    const breakdown = {};
    const reasons = [];
    
    // 1. Semantic ingredient matching (40 points)
    let semanticMatches = 0;
    const productIngredients = product.keyIngredients || [];
    
    for (const ingredient of topSemanticIngredients) {
      const isMatch = productIngredients.some(prodIng => 
        this.isIngredientMatch(prodIng, ingredient)
      );
      if (isMatch) semanticMatches++;
    }
    
    const semanticScore = Math.min(40, semanticMatches * 8);
    totalScore += semanticScore;
    breakdown.semanticMatch = semanticScore;
    
    if (semanticMatches > 0) {
      reasons.push(`Contains ${semanticMatches} ontology-recommended ingredients`);
    }
    
    // 2. Skin type compatibility (25 points)
    const skinTypeScore = (product.suitableForSkinTypes || [])
      .some(type => type.toLowerCase() === skinType.toLowerCase()) ? 25 : 0;
    totalScore += skinTypeScore;
    breakdown.skinTypeMatch = skinTypeScore;
    
    if (skinTypeScore > 0) {
      reasons.push(`Formulated for ${skinType} skin`);
    }
    
    // 3. Concern addressing (25 points)
    let concernMatches = 0;
    if (skinConcerns && skinConcerns.length > 0) {
      const productConcerns = product.addressesConcerns || [];
      concernMatches = skinConcerns.filter(concern =>
        productConcerns.some(pc => 
          pc.toLowerCase().includes(concern.toLowerCase())
        )
      ).length;
    }
    
    const concernScore = Math.min(25, concernMatches * 12);
    totalScore += concernScore;
    breakdown.concernMatch = concernScore;
    
    if (concernMatches > 0) {
      reasons.push(`Addresses ${concernMatches} of your skin concerns`);
    }
    
    // 4. Product quality indicators (10 points)
    let qualityScore = 0;
    if (product.rating && product.rating > 4) qualityScore += 3;
    if (product.favoriteCount && product.favoriteCount > 100) qualityScore += 2;
    if (product.viewCount && product.viewCount > 1000) qualityScore += 2;
    if (product.bpomNumber) qualityScore += 3;
    
    totalScore += qualityScore;
    breakdown.qualityScore = qualityScore;
    
    return {
      totalScore: Math.round(totalScore),
      breakdown,
      reasons: reasons.length > 0 ? reasons : ['General skincare match']
    };
  }
  
  isIngredientMatch(productIngredient, ontologyIngredient) {
    const prod = productIngredient.toLowerCase().trim();
    const onto = ontologyIngredient.toLowerCase().trim();
    
    // Direct match
    if (prod.includes(onto) || onto.includes(prod)) return true;
    
    // Common ingredient variations
    const variations = {
      'hyaluronic acid': ['sodium hyaluronate', 'hyaluronate'],
      'vitamin c': ['ascorbic acid', 'l-ascorbic acid', 'magnesium ascorbyl phosphate'],
      'niacinamide': ['nicotinamide', 'vitamin b3'],
      'retinol': ['retinyl palmitate', 'retinaldehyde'],
      'salicylic acid': ['bha', 'beta hydroxy acid']
    };
    
    for (const [main, vars] of Object.entries(variations)) {
      if ((prod.includes(main) || vars.some(v => prod.includes(v))) &&
          (onto.includes(main) || vars.some(v => onto.includes(v)))) {
        return true;
      }
    }
    
    return false;
  }
  
  async getFallbackRecommendations(userProfile, options) {
    console.log('🔄 Using fallback recommendation logic');
    
    const { skinType, skinConcerns } = userProfile;
    const where = { isActive: true };
    
    // Simple skin type matching
    if (skinType) {
      where.suitableForSkinTypes = { [Op.contains]: [skinType] };
    }
    
    const products = await Product.findAll({
      where,
      limit: options.limit || 20,
      order: [['createdAt', 'DESC']]
    });
    
    return {
      recommendations: products.map(p => ({
        ...p.toJSON(),
        score: 50, // Default score
        matchReasons: ['Basic skin type match']
      })),
      semanticInsights: {
        method: 'fallback',
        topIngredients: [],
        reasoning: ['Using simplified matching due to ontology unavailability']
      }
    };
  }
}

module.exports = new EnhancedRecommendationService();