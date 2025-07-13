const ontologyService = require('./ontologyService');
const { Product, UserProfile } = require('../models');
const { Op } = require('sequelize');

class SemanticRecommendationEngine {
  constructor() {
    this.weightConfig = {
      semanticMatch: 0.45,        // 45% - Ontology-based ingredient matching
      concernsAddressing: 0.25,   // 25% - Addresses user concerns
      ingredientSynergy: 0.15,    // 15% - Ingredient interaction analysis
      formulationSafety: 0.10,    // 10% - Safety for user sensitivities
      categoryRelevance: 0.05     // 5% - Product category appropriateness
    };
    
    this.logger = console;
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async generateRecommendations(userId, options = {}) {
    try {
      this.logger.log('🧠 Generating semantic recommendations...');

      // Get or create user profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile required for recommendations');
      }

      // Ensure ontology service is loaded
      if (!ontologyService.isLoaded()) {
        await ontologyService.loadOntology();
      }

      // Get semantic analysis from ontology
      const semanticAnalysis = await ontologyService.getSemanticRecommendations(userProfile);
      
      this.logger.log(`💡 Using method: ${semanticAnalysis.method}`);
      this.logger.log(`🔍 Found ${semanticAnalysis.recommendedIngredients.length} recommended ingredients`);

      // Get candidate products from database
      const candidates = await this.getCandidateProducts(userProfile, semanticAnalysis, options);
      
      this.logger.log(`📦 Analyzing ${candidates.length} candidate products`);

      // Score each product using semantic reasoning
      const scoredProducts = await this.scoreProductsWithSemantics(candidates, userProfile, semanticAnalysis);

      // Filter and sort recommendations
      const qualityThreshold = options.strictMode ? 50 : 30;
      const recommendations = scoredProducts
        .filter(item => item.totalScore > qualityThreshold)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, options.limit || 20);

      this.logger.log(`✅ Generated ${recommendations.length} semantic recommendations`);

      // Build comprehensive response
      const result = {
        recommendations: recommendations.map(item => ({
          product: this.formatProduct(item.product),
          matchScore: item.totalScore,
          explanation: item.explanation,
          semanticInsights: item.semanticInsights,
          breakdown: item.breakdown,
          tags: this.generateProductTags(item, userProfile)
        })),
        semanticAnalysis: {
          method: semanticAnalysis.method,
          confidence: semanticAnalysis.confidence,
          recommendedIngredients: semanticAnalysis.recommendedIngredients.slice(0, 8),
          interactions: semanticAnalysis.interactions,
          reasoning: semanticAnalysis.reasoning
        },
        userProfile: {
          skinType: userProfile.skinType,
          skinConcerns: userProfile.skinConcerns,
          knownSensitivities: userProfile.knownSensitivities || []
        },
        metadata: {
          totalCandidates: candidates.length,
          qualityThreshold,
          ontologyMethod: semanticAnalysis.method,
          processingTime: Date.now(),
          filters: this.getAppliedFilters(options),
          stats: ontologyService.getStats()
        }
      };

      // Cache the result
      this.cacheResult(userId, options, result);

      return result;

    } catch (error) {
      this.logger.error('❌ Semantic recommendation generation failed:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    if (!userId || userId === 'guest') {
      throw new Error('Valid user ID required for semantic recommendations');
    }

    try {
      const profile = await UserProfile.findOne({ where: { userId } });
      
      if (!profile) {
        this.logger.log('📝 User profile not found, creating default...');
        // You might want to handle this differently based on your needs
        return null;
      }

      return {
        userId: profile.userId,
        skinType: profile.skinType,
        skinConcerns: profile.skinConcerns || [],
        knownSensitivities: profile.knownSensitivities || [],
        preferences: profile.preferences || {}
      };
    } catch (error) {
      this.logger.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async getCandidateProducts(userProfile, semanticAnalysis, options) {
    const { skinType, knownSensitivities } = userProfile;
    
    // Build base query
    const where = { 
      productName: { [Op.ne]: null },
      brand: { [Op.ne]: null },
      isActive: true
    };

    // Apply category filter if specified
    if (options.category) {
      where[Op.or] = [
        { mainCategory: { [Op.iLike]: `%${options.category}%` } },
        { subcategory: { [Op.iLike]: `%${options.category}%` } }
      ];
    }

    // Apply brand filter if specified
    if (options.brand) {
      where.brand = { [Op.iLike]: `%${options.brand}%` };
    }

    // Apply safety filters based on sensitivities
    this.applySensitivityFilters(where, knownSensitivities);

    // Get semantically recommended ingredients for filtering
    const topIngredients = semanticAnalysis.recommendedIngredients
      .slice(0, 10)
      .map(rec => rec.ingredient);

    // Expand query to include products with recommended ingredients or suitable for skin type
    if (topIngredients.length > 0) {
      const expandedWhere = {
        ...where,
        [Op.or]: [
          { keyIngredients: { [Op.overlap]: topIngredients } },
          { suitableForSkinTypes: { [Op.contains]: [skinType] } },
          { addressesConcerns: { [Op.overlap]: userProfile.skinConcerns || [] } }
        ]
      };
      
      // Try expanded query first
      let products = await Product.findAll({
        where: expandedWhere,
        limit: options.candidateLimit || 100,
        order: [['createdAt', 'DESC']],
        attributes: this.getProductAttributes()
      });

      // If not enough products, fall back to basic query
      if (products.length < 20) {
        const additionalProducts = await Product.findAll({
          where,
          limit: Math.max(50, options.candidateLimit || 100),
          order: [['createdAt', 'DESC']],
          attributes: this.getProductAttributes()
        });
        
        // Merge and deduplicate
        const existingIds = new Set(products.map(p => p.id));
        const newProducts = additionalProducts.filter(p => !existingIds.has(p.id));
        products = [...products, ...newProducts];
      }

      return products;
    }

    // Fallback to basic query
    return Product.findAll({
      where,
      limit: options.candidateLimit || 80,
      order: [['createdAt', 'DESC']],
      attributes: this.getProductAttributes()
    });
  }

  getProductAttributes() {
    return [
      'id', 'productName', 'brand', 'mainCategory', 'subcategory', 'description',
      'keyIngredients', 'imageUrls', 'suitableForSkinTypes', 
      'addressesConcerns', 'providedBenefits', 'regularPrice',
      'alcoholFree', 'fragranceFree', 'parabenFree', 'sulfateFree', 'siliconeFree',
      'fungalAcneFree', 'viewCount', 'favoriteCount', 'rating'
    ];
  }

  async scoreProductsWithSemantics(products, userProfile, semanticAnalysis) {
    const promises = products.map(product => this.scoreIndividualProduct(product, userProfile, semanticAnalysis));
    return Promise.all(promises);
  }

  async scoreIndividualProduct(product, userProfile, semanticAnalysis) {
    try {
      const scores = {
        semanticMatch: 0,
        concernsAddressing: 0,
        ingredientSynergy: 0,
        formulationSafety: 0,
        categoryRelevance: 0,
        explanationParts: [],
        semanticInsights: {}
      };

      // 1. SEMANTIC MATCHING ANALYSIS (45%)
      const semanticResult = await this.calculateSemanticMatchScore(
        product, 
        userProfile, 
        semanticAnalysis.recommendedIngredients
      );
      scores.semanticMatch = semanticResult.score;
      scores.explanationParts.push(...semanticResult.explanations);
      scores.semanticInsights.ontologyMatches = semanticResult.matches;
      scores.semanticInsights.matchDetails = semanticResult.details;

      // 2. CONCERNS ADDRESSING ANALYSIS (25%)
      const concernsResult = this.calculateConcernsScore(product, userProfile.skinConcerns);
      scores.concernsAddressing = concernsResult.score;
      scores.explanationParts.push(...concernsResult.explanations);

      // 3. INGREDIENT SYNERGY ANALYSIS (15%)
      const synergyResult = this.calculateIngredientSynergyScore(
        product, 
        semanticAnalysis.interactions
      );
      scores.ingredientSynergy = synergyResult.score;
      scores.explanationParts.push(...synergyResult.explanations);
      scores.semanticInsights.interactions = synergyResult.interactions;

      // 4. FORMULATION SAFETY ANALYSIS (10%)
      const safetyResult = this.calculateFormulationSafetyScore(product, userProfile.knownSensitivities);
      scores.formulationSafety = safetyResult.score;
      scores.explanationParts.push(...safetyResult.explanations);

      // 5. CATEGORY RELEVANCE ANALYSIS (5%)
      const categoryResult = this.calculateCategoryRelevanceScore(product, userProfile.skinType);
      scores.categoryRelevance = categoryResult.score;
      if (categoryResult.explanation) {
        scores.explanationParts.push(categoryResult.explanation);
      }

      // Calculate weighted total score
      const totalScore = Math.round(
        (scores.semanticMatch * this.weightConfig.semanticMatch) +
        (scores.concernsAddressing * this.weightConfig.concernsAddressing) +
        (scores.ingredientSynergy * this.weightConfig.ingredientSynergy) +
        (scores.formulationSafety * this.weightConfig.formulationSafety) +
        (scores.categoryRelevance * this.weightConfig.categoryRelevance)
      );

      return {
        product,
        totalScore: Math.max(0, Math.min(100, totalScore)),
        breakdown: {
          semanticMatch: Math.round(scores.semanticMatch),
          concernsAddressing: Math.round(scores.concernsAddressing),
          ingredientSynergy: Math.round(scores.ingredientSynergy),
          formulationSafety: Math.round(scores.formulationSafety),
          categoryRelevance: Math.round(scores.categoryRelevance)
        },
        explanation: this.buildExplanation(scores.explanationParts, totalScore),
        semanticInsights: scores.semanticInsights
      };

    } catch (error) {
      this.logger.error(`Error scoring product ${product.id}:`, error);
      return {
        product,
        totalScore: 20,
        breakdown: { error: true },
        explanation: 'Error in semantic analysis',
        semanticInsights: {}
      };
    }
  }

  async calculateSemanticMatchScore(product, userProfile, recommendedIngredients) {
    let score = 0;
    const explanations = [];
    const matches = [];
    const details = {};

    const productKeyIngredients = Array.isArray(product.keyIngredients) ? product.keyIngredients : [];

    // 1. Direct Ontology Ingredient Matching (35 points max)
    let directMatches = 0;
    for (const recIngredient of recommendedIngredients.slice(0, 8)) {
      const isMatch = productKeyIngredients.some(prodIngredient =>
        this.isIngredientMatch(prodIngredient, recIngredient.ingredient)
      );

      if (isMatch) {
        directMatches++;
        const ingredientScore = Math.min(8, recIngredient.score / 12); // Scale to 0-8 points per ingredient
        score += ingredientScore;
        
        matches.push({
          ingredient: recIngredient.ingredient,
          score: recIngredient.score,
          reasons: recIngredient.reasons || [],
          efficacy: recIngredient.efficacyScore || 50
        });
      }
    }

    if (directMatches > 0) {
      explanations.push(`Contains ${directMatches} ontology-recommended ingredients`);
      details.directMatches = directMatches;
    }

    // 2. Skin Type Suitability from Product Data (10 points max)
    const skinTypeSuitable = Array.isArray(product.suitableForSkinTypes) && 
      product.suitableForSkinTypes.includes(userProfile.skinType);
    
    if (skinTypeSuitable) {
      score += 10;
      explanations.push(`Specifically formulated for ${userProfile.skinType} skin`);
      details.skinTypeMatch = true;
    }

    // 3. High-Efficacy Ingredient Bonus (5 points max)
    const highEfficacyMatches = matches.filter(m => m.efficacy > 85);
    if (highEfficacyMatches.length > 0) {
      score += Math.min(5, highEfficacyMatches.length * 2);
      explanations.push(`Contains ${highEfficacyMatches.length} high-efficacy ingredients`);
      details.highEfficacyCount = highEfficacyMatches.length;
    }

    return {
      score: Math.min(50, score), // Cap at 50 points
      explanations,
      matches,
      details
    };
  }

  calculateConcernsScore(product, userConcerns) {
    const explanations = [];
    
    if (!userConcerns || userConcerns.length === 0) {
      return { score: 70, explanations: ['No specific concerns to address'] };
    }

    const productConcerns = Array.isArray(product.addressesConcerns) ? product.addressesConcerns : [];
    const productBenefits = Array.isArray(product.providedBenefits) ? product.providedBenefits : [];
    
    let addressedConcerns = [];

    // Direct concern matching
    for (const userConcern of userConcerns) {
      const directMatch = productConcerns.some(productConcern => 
        this.isConcernMatch(userConcern, productConcern)
      );
      
      if (directMatch) {
        addressedConcerns.push(userConcern);
        continue;
      }

      // Indirect matching through benefits
      const benefitMatch = this.findBenefitConcernMatch(userConcern, productBenefits);
      if (benefitMatch) {
        addressedConcerns.push(userConcern);
      }
    }

    // Remove duplicates
    addressedConcerns = [...new Set(addressedConcerns)];

    let score = 30; // Base score
    
    if (addressedConcerns.length > 0) {
      const coverageRatio = addressedConcerns.length / userConcerns.length;
      score = 30 + (coverageRatio * 70); // Scale to 30-100
      explanations.push(`Addresses ${addressedConcerns.length}/${userConcerns.length} of your concerns`);
      
      if (coverageRatio >= 0.8) {
        explanations.push('Comprehensive concern coverage');
      }
    } else {
      explanations.push('Does not specifically target your concerns');
    }

    return { 
      score: Math.round(score), 
      explanations,
      addressedConcerns
    };
  }

  calculateIngredientSynergyScore(product, semanticInteractions) {
    let score = 50; // Base score
    const explanations = [];
    const productKeyIngredients = Array.isArray(product.keyIngredients) ? product.keyIngredients : [];

    if (productKeyIngredients.length < 2) {
      return { 
        score, 
        explanations: ['Single key ingredient - no interaction analysis'], 
        interactions: { synergistic: 0, incompatible: 0 }
      };
    }

    let synergisticCount = 0;
    let incompatibleCount = 0;
    let potentiatingCount = 0;

    // Check for synergistic combinations
    if (semanticInteractions.synergistic) {
      for (const synergy of semanticInteractions.synergistic) {
        const hasIng1 = productKeyIngredients.some(prod => 
          this.isIngredientMatch(prod, synergy.ingredients[0])
        );
        const hasIng2 = productKeyIngredients.some(prod => 
          this.isIngredientMatch(prod, synergy.ingredients[1])
        );

        if (hasIng1 && hasIng2) {
          synergisticCount++;
          score += 15; // Bonus for synergistic combinations
        }
      }
    }

    // Check for potentiating relationships
    if (semanticInteractions.potentiating) {
      for (const potentiation of semanticInteractions.potentiating) {
        const hasEnhancer = productKeyIngredients.some(prod => 
          this.isIngredientMatch(prod, potentiation.enhancer)
        );
        const hasEnhanced = productKeyIngredients.some(prod => 
          this.isIngredientMatch(prod, potentiation.enhanced)
        );

        if (hasEnhancer && hasEnhanced) {
          potentiatingCount++;
          score += 10;
        }
      }
    }

    // Check for incompatible combinations
    if (semanticInteractions.incompatible) {
      for (const conflict of semanticInteractions.incompatible) {
        const hasIng1 = productKeyIngredients.some(prod => 
          this.isIngredientMatch(prod, conflict.ingredients[0])
        );
        const hasIng2 = productKeyIngredients.some(prod => 
          this.isIngredientMatch(prod, conflict.ingredients[1])
        );

        if (hasIng1 && hasIng2) {
          incompatibleCount++;
          const penalty = conflict.severity === 'high' ? 25 : 15;
          score -= penalty;
        }
      }
    }

    // Generate explanations
    if (synergisticCount > 0) {
      explanations.push(`${synergisticCount} beneficial ingredient synergies`);
    }
    if (potentiatingCount > 0) {
      explanations.push(`${potentiatingCount} ingredient enhancement effects`);
    }
    if (incompatibleCount > 0) {
      explanations.push(`⚠️ ${incompatibleCount} potential ingredient conflicts`);
    }
    if (synergisticCount === 0 && incompatibleCount === 0 && potentiatingCount === 0) {
      explanations.push('No significant ingredient interactions detected');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      explanations,
      interactions: {
        synergistic: synergisticCount,
        incompatible: incompatibleCount,
        potentiating: potentiatingCount
      }
    };
  }

  calculateFormulationSafetyScore(product, userSensitivities) {
    let score = 100; // Start with perfect safety score
    const explanations = [];

    if (!userSensitivities || userSensitivities.length === 0) {
      return { score, explanations: ['No known sensitivities to check'] };
    }

    const safetyChecks = {
      'fragrance': {
        property: 'fragranceFree',
        penalty: 25,
        safeLabel: 'Fragrance-free formulation',
        unsafeLabel: 'May contain fragrance'
      },
      'alcohol': {
        property: 'alcoholFree',
        penalty: 20,
        safeLabel: 'Alcohol-free formulation',
        unsafeLabel: 'May contain drying alcohols'
      },
      'silicone': {
        property: 'siliconeFree',
        penalty: 10,
        safeLabel: 'Silicone-free formulation',
        unsafeLabel: 'Contains silicones'
      },
      'paraben': {
        property: 'parabenFree',
        penalty: 15,
        safeLabel: 'Paraben-free formulation',
        unsafeLabel: 'May contain parabens'
      },
      'sulfate': {
        property: 'sulfateFree',
        penalty: 15,
        safeLabel: 'Sulfate-free formulation',
        unsafeLabel: 'May contain sulfates'
      }
    };

    for (const sensitivity of userSensitivities) {
      const check = safetyChecks[sensitivity.toLowerCase()];
      if (check) {
        if (product[check.property] === true) {
          explanations.push(`✓ ${check.safeLabel}`);
        } else {
          score -= check.penalty;
          explanations.push(`⚠️ ${check.unsafeLabel}`);
        }
      }
    }

    return { 
      score: Math.max(0, score), 
      explanations 
    };
  }

  calculateCategoryRelevanceScore(product, skinType) {
    const categoryRelevance = {
      'dry': {
        preferred: ['moisturizer', 'serum', 'oil', 'cream', 'hydrating', 'nourishing'],
        bonus: 15
      },
      'oily': {
        preferred: ['cleanser', 'toner', 'serum', 'gel', 'oil control', 'mattifying'],
        bonus: 15
      },
      'combination': {
        preferred: ['serum', 'moisturizer', 'toner', 'balancing', 'dual-action'],
        bonus: 12
      },
      'sensitive': {
        preferred: ['gentle', 'serum', 'moisturizer', 'soothing', 'calming'],
        bonus: 15
      },
      'normal': {
        preferred: ['serum', 'moisturizer', 'cleanser', 'maintenance', 'preventive'],
        bonus: 10
      }
    };

    const relevance = categoryRelevance[skinType.toLowerCase()];
    if (!relevance) {
      return { score: 60, explanation: null };
    }

    const isRelevant = relevance.preferred.some(keyword => 
      product.mainCategory?.toLowerCase().includes(keyword) ||
      product.subcategory?.toLowerCase().includes(keyword) ||
      product.productName?.toLowerCase().includes(keyword)
    );

    return {
      score: isRelevant ? 80 + relevance.bonus : 50,
      explanation: isRelevant ? `Suitable category for ${skinType} skin` : null
    };
  }

  // UTILITY METHODS

  isIngredientMatch(productIngredient, ontologyIngredient) {
    const prod = productIngredient.toLowerCase().trim();
    const onto = ontologyIngredient.toLowerCase().trim();
    
    // Direct inclusion match
    if (prod.includes(onto) || onto.includes(prod)) {
      return true;
    }

    // Handle common ingredient name variations
    const variations = {
      'hyaluronic acid': ['sodium hyaluronate', 'hyaluronate', 'ha'],
      'vitamin c': ['ascorbic acid', 'l-ascorbic acid', 'magnesium ascorbyl phosphate', 'sodium ascorbyl phosphate', 'ascorbyl glucoside'],
      'vitamin e': ['tocopherol', 'tocopheryl acetate', 'mixed tocopherols'],
      'salicylic acid': ['bha', 'beta hydroxy acid', 'willow bark extract'],
      'glycolic acid': ['aha', 'alpha hydroxy acid'],
      'retinol': ['retinyl palmitate', 'retinyl acetate', 'retinaldehyde', 'retinyl linoleate'],
      'niacinamide': ['nicotinamide', 'vitamin b3'],
      'ceramides': ['ceramide np', 'ceramide ns', 'ceramide ap', 'ceramide eop'],
      'centella asiatica': ['centella', 'cica', 'tiger grass'],
      'tea tree oil': ['melaleuca alternifolia', 'tea tree', 'melaleuca oil']
    };

    for (const [main, vars] of Object.entries(variations)) {
      if ((prod.includes(main) || vars.some(v => prod.includes(v))) &&
          (onto.includes(main) || vars.some(v => onto.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  isConcernMatch(userConcern, productConcern) {
    const user = userConcern.toLowerCase().replace(/[_\s]/g, '');
    const product = productConcern.toLowerCase().replace(/[_\s]/g, '');
    
    return user.includes(product) || product.includes(user);
  }

  findBenefitConcernMatch(userConcern, productBenefits) {
    const concernBenefitMap = {
      'acne': ['acne fighter', 'pore minimizing', 'oil controlling', 'exfoliating'],
      'wrinkles': ['anti-aging', 'firming', 'line reducing'],
      'finelines': ['anti-aging', 'hydrating', 'smoothing'],
      'dryness': ['hydrating', 'moisturizing', 'nourishing'],
      'oiliness': ['oil controlling', 'mattifying', 'pore minimizing'],
      'darkspots': ['brightening', 'spot correcting', 'evening'],
      'largepores': ['pore minimizing', 'refining', 'tightening'],
      'redness': ['soothing', 'calming', 'reducing redness'],
      'sensitivity': ['soothing', 'calming', 'gentle'],
      'dullness': ['brightening', 'illuminating', 'radiance'],
      'uneventexture': ['smoothing', 'exfoliating', 'refining']
    };

    const relevantBenefits = concernBenefitMap[userConcern.toLowerCase().replace(/[_\s]/g, '')] || [];
    
    return productBenefits.some(benefit =>
      relevantBenefits.some(relevantBenefit =>
        benefit.toLowerCase().includes(relevantBenefit.toLowerCase())
      )
    );
  }

  applySensitivityFilters(where, sensitivities) {
    if (!sensitivities || sensitivities.length === 0) return;

    // Only include products that are safe for user's sensitivities
    const sensitivityFilters = {};
    
    if (sensitivities.includes('fragrance')) {
      sensitivityFilters.fragranceFree = true;
    }
    if (sensitivities.includes('alcohol')) {
      sensitivityFilters.alcoholFree = true;
    }
    if (sensitivities.includes('silicone')) {
      sensitivityFilters.siliconeFree = true;
    }
    if (sensitivities.includes('paraben')) {
      sensitivityFilters.parabenFree = true;
    }
    if (sensitivities.includes('sulfate')) {
      sensitivityFilters.sulfateFree = true;
    }

    Object.assign(where, sensitivityFilters);
  }

  buildExplanation(explanationParts, totalScore) {
    const filteredParts = explanationParts
      .filter(part => part && part.trim().length > 0)
      .slice(0, 4); // Limit to most important explanations

    if (filteredParts.length === 0) {
      return 'Basic compatibility analysis completed';
    }

    let explanation = filteredParts.join(' • ');

    // Add score context
    if (totalScore >= 80) {
      explanation = '🌟 Excellent match: ' + explanation;
    } else if (totalScore >= 60) {
      explanation = '👍 Good match: ' + explanation;
    } else if (totalScore >= 40) {
      explanation = '✋ Moderate match: ' + explanation;
    } else {
      explanation = '⚠️ Limited match: ' + explanation;
    }

    return explanation;
  }

  generateProductTags(scoredProduct, userProfile) {
    const tags = [];
    const { totalScore, semanticInsights, breakdown } = scoredProduct;

    // Score-based tags
    if (totalScore >= 85) tags.push('Perfect Match');
    else if (totalScore >= 70) tags.push('Great Match');
    else if (totalScore >= 55) tags.push('Good Match');

    // Semantic insight tags
    if (semanticInsights.ontologyMatches?.length > 0) {
      tags.push('Semantic Recommended');
    }

    if (semanticInsights.interactions?.synergistic > 0) {
      tags.push('Synergistic Formula');
    }

    if (semanticInsights.interactions?.incompatible > 0) {
      tags.push('Interaction Warning');
    }

    // Breakdown-based tags
    if (breakdown.semanticMatch > 80) tags.push('AI Recommended');
    if (breakdown.concernsAddressing > 85) tags.push('Targets Your Concerns');
    if (breakdown.formulationSafety > 95) tags.push('Sensitivity Safe');

    return tags.slice(0, 3); // Limit to 3 most relevant tags
  }

  formatProduct(product) {
    return {
      id: product.id,
      productName: product.productName,
      brand: product.brand,
      mainCategory: product.mainCategory,
      subcategory: product.subcategory,
      description: product.description,
      keyIngredients: product.keyIngredients || [],
      imageUrls: product.imageUrls || [],
      regularPrice: product.regularPrice,
      formulation: {
        alcoholFree: product.alcoholFree,
        fragranceFree: product.fragranceFree,
        parabenFree: product.parabenFree,
        sulfateFree: product.sulfateFree,
        siliconeFree: product.siliconeFree,
        fungalAcneFree: product.fungalAcneFree
      },
      stats: {
        viewCount: product.viewCount || 0,
        favoriteCount: product.favoriteCount || 0,
        rating: product.rating || 0
      }
    };
  }

  getAppliedFilters(options) {
    const filters = [];
    
    if (options.category) filters.push(`Category: ${options.category}`);
    if (options.brand) filters.push(`Brand: ${options.brand}`);
    if (options.strictMode) filters.push('Strict Quality Mode');
    if (options.candidateLimit) filters.push(`Candidate Limit: ${options.candidateLimit}`);
    
    return filters;
  }

  cacheResult(userId, options, result) {
    const cacheKey = `${userId}_${JSON.stringify(options)}`;
    this.cache.set(cacheKey, result);
    
    // Auto-cleanup cache
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.cacheTimeout);
  }

  // PUBLIC INTERFACE METHODS

  async getQuickRecommendations(skinType, concerns = [], limit = 10) {
    try {
      const userProfile = { skinType, skinConcerns: concerns, knownSensitivities: [] };
      
      if (!ontologyService.isLoaded()) {
        await ontologyService.loadOntology();
      }

      const semanticAnalysis = await ontologyService.getSemanticRecommendations(userProfile);
      const candidates = await this.getCandidateProducts(userProfile, semanticAnalysis, { limit: 30 });
      const scored = await this.scoreProductsWithSemantics(candidates, userProfile, semanticAnalysis);
      
      return scored
        .filter(item => item.totalScore > 40)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
        .map(item => ({
          product: this.formatProduct(item.product),
          score: item.totalScore,
          explanation: item.explanation
        }));

    } catch (error) {
      this.logger.error('Error generating quick recommendations:', error);
      return [];
    }
  }

  async analyzeProduct(productId, userProfile) {
    try {
      const product = await Product.findByPk(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      return ontologyService.calculateSemanticProductScore(product, userProfile);
    } catch (error) {
      this.logger.error('Error analyzing product:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
    this.logger.log('🗑️ Recommendation cache cleared');
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      weightConfig: this.weightConfig,
      ontologyStats: ontologyService.getStats()
    };
  }
}

// Export singleton instance
module.exports = new SemanticRecommendationEngine();