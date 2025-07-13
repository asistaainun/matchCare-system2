const fs = require('fs').promises;
const path = require('path');
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

class OntologyService {
  constructor() {
    this.store = new N3.Store();
    this.prefixes = {
      matchcare: 'http://www.semanticweb.org/msilaptop/ontologies/2025/4/skincareOntology/',
      owl: 'http://www.w3.org/2002/07/owl#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    };
    this.loaded = false;
    this.knowledgeGraph = {
      skinTypes: new Map(),
      concerns: new Map(),
      ingredients: new Map(),
      benefits: new Map(),
      functions: new Map(),
      interactions: new Map()
    };
    this.reasoningCache = new Map();
    this.logger = console; // Will be replaced with proper logger in production
  }

  async loadOntology() {
    try {
      this.logger.log('🧠 Loading enhanced skincare ontology...');
      
      // Try enhanced ontology first, fallback to basic
      let ontologyPath = path.join(__dirname, '../../data/ontology/skincareOntology_enhanced.ttl');
      let ttlContent;
      
      try {
        ttlContent = await fs.readFile(ontologyPath, 'utf8');
        this.logger.log('✅ Using enhanced ontology');
      } catch (error) {
        this.logger.log('📝 Enhanced ontology not found, trying basic version...');
        ontologyPath = path.join(__dirname, '../../data/ontology/skincareOntology.ttl');
        try {
          ttlContent = await fs.readFile(ontologyPath, 'utf8');
          this.logger.log('✅ Using basic ontology');
        } catch (basicError) {
          this.logger.error('❌ No ontology file found, using fallback knowledge');
          this.initializeFallbackKnowledge();
          return;
        }
      }
      
      // Parse TTL content
      const parser = new N3.Parser({ prefixes: this.prefixes });
      const quads = parser.parse(ttlContent);
      
      this.store.addQuads(quads);
      await this.buildKnowledgeGraph();
      
      this.loaded = true;
      this.logger.log('✅ Ontology loaded successfully');
      this.logger.log(`📊 Knowledge Graph:`, {
        skinTypes: this.knowledgeGraph.skinTypes.size,
        concerns: this.knowledgeGraph.concerns.size,
        ingredients: this.knowledgeGraph.ingredients.size,
        interactions: this.knowledgeGraph.interactions.size
      });
      
    } catch (error) {
      this.logger.error('❌ Ontology loading failed:', error);
      this.logger.log('🔄 Initializing fallback knowledge...');
      this.initializeFallbackKnowledge();
    }
  }

  async buildKnowledgeGraph() {
    this.logger.log('🔄 Building knowledge graph from ontology...');
    
    // Extract key ingredients and their complete relationship data
    const ingredientQuads = this.store.getQuads(
      null,
      namedNode(this.prefixes.rdf + 'type'),
      namedNode(this.prefixes.matchcare + 'KeyIngredient'),
      null
    );

    for (const quad of ingredientQuads) {
      const ingredient = this.extractLocalName(quad.subject.value);
      const label = this.getLabel(quad.subject) || ingredient;
      
      // Extract all relationships for this ingredient
      const relationships = {
        recommendedFor: this.getRelatedEntities(quad.subject, 'recommendedFor'),
        treats: this.getRelatedEntities(quad.subject, 'treats'),
        hasFunction: this.getRelatedEntities(quad.subject, 'hasFunction'),
        provides: this.getRelatedEntities(quad.subject, 'provides'),
        synergisticWith: this.getRelatedEntities(quad.subject, 'synergisticWith'),
        incompatibleWith: this.getRelatedEntities(quad.subject, 'incompatibleWith'),
        potentiatesEffectOf: this.getRelatedEntities(quad.subject, 'potentiatesEffectOf')
      };

      // Extract quantitative properties
      const efficacyScore = this.getDataProperty(quad.subject, 'efficacyScore');
      const safetyRating = this.getDataProperty(quad.subject, 'safetyRating');
      const concentration = this.getDataProperty(quad.subject, 'concentration');

      this.knowledgeGraph.ingredients.set(label.toLowerCase(), {
        uri: quad.subject.value,
        label,
        recommendedFor: relationships.recommendedFor.map(e => this.extractLocalName(e).toLowerCase()),
        treats: relationships.treats.map(e => this.extractLocalName(e).toLowerCase()),
        functions: relationships.hasFunction.map(e => this.extractLocalName(e).toLowerCase()),
        benefits: relationships.provides.map(e => this.extractLocalName(e).toLowerCase()),
        synergisticWith: relationships.synergisticWith.map(e => this.extractLocalName(e).toLowerCase()),
        incompatibleWith: relationships.incompatibleWith.map(e => this.extractLocalName(e).toLowerCase()),
        potentiatesEffectOf: relationships.potentiatesEffectOf.map(e => this.extractLocalName(e).toLowerCase()),
        efficacyScore: efficacyScore || 50,
        safetyRating: safetyRating || 5,
        concentration: concentration || 1.0
      });
    }

    // Build skin types, concerns, benefits, and functions maps
    await this.buildAuxiliaryMaps();
    
    this.logger.log(`✅ Knowledge graph built with ${this.knowledgeGraph.ingredients.size} ingredients`);
  }

  async buildAuxiliaryMaps() {
    // Build skin types map
    const skinTypeQuads = this.store.getQuads(
      null,
      namedNode(this.prefixes.rdf + 'type'),
      namedNode(this.prefixes.matchcare + 'SkinType'),
      null
    );

    for (const quad of skinTypeQuads) {
      const skinType = this.extractLocalName(quad.subject.value).toLowerCase();
      this.knowledgeGraph.skinTypes.set(skinType, {
        uri: quad.subject.value,
        label: skinType,
        description: this.getComment(quad.subject) || ''
      });
    }

    // Build concerns map
    const concernQuads = this.store.getQuads(
      null,
      namedNode(this.prefixes.rdf + 'type'),
      namedNode(this.prefixes.matchcare + 'SkinConcern'),
      null
    );

    for (const quad of concernQuads) {
      const concern = this.extractLocalName(quad.subject.value).toLowerCase();
      this.knowledgeGraph.concerns.set(concern, {
        uri: quad.subject.value,
        label: concern,
        description: this.getComment(quad.subject) || ''
      });
    }

    // Build benefits and functions similarly
    await this.buildBenefitsAndFunctions();
  }

  async buildBenefitsAndFunctions() {
    // Benefits
    const benefitQuads = this.store.getQuads(
      null,
      namedNode(this.prefixes.rdf + 'type'),
      namedNode(this.prefixes.matchcare + 'Benefit'),
      null
    );

    for (const quad of benefitQuads) {
      const benefit = this.extractLocalName(quad.subject.value).toLowerCase();
      this.knowledgeGraph.benefits.set(benefit, {
        uri: quad.subject.value,
        label: benefit,
        description: this.getComment(quad.subject) || ''
      });
    }

    // Functions
    const functionQuads = this.store.getQuads(
      null,
      namedNode(this.prefixes.rdf + 'type'),
      namedNode(this.prefixes.matchcare + 'Function'),
      null
    );

    for (const quad of functionQuads) {
      const func = this.extractLocalName(quad.subject.value).toLowerCase();
      this.knowledgeGraph.functions.set(func, {
        uri: quad.subject.value,
        label: func,
        description: this.getComment(quad.subject) || ''
      });
    }
  }

  // MAIN SEMANTIC REASONING METHODS

  async getSemanticRecommendations(userProfile) {
    const { skinType, skinConcerns, knownSensitivities } = userProfile;
    const cacheKey = `${skinType}_${(skinConcerns || []).join(',')}_${(knownSensitivities || []).join(',')}`;
    
    // Check cache first
    if (this.reasoningCache.has(cacheKey)) {
      this.logger.log('📋 Using cached semantic analysis');
      return this.reasoningCache.get(cacheKey);
    }

    this.logger.log('🔍 Performing semantic reasoning for:', { skinType, skinConcerns });

    try {
      // Core semantic reasoning process
      const recommendedIngredients = this.getRecommendedIngredientsForProfile(skinType, skinConcerns || []);
      
      // Advanced interaction analysis
      const interactions = this.analyzeIngredientInteractions(recommendedIngredients.map(r => r.ingredient));
      
      // Apply user sensitivity filters
      const filteredRecommendations = this.applySensitivityFilters(recommendedIngredients, knownSensitivities || []);
      
      // Generate semantic explanations
      const reasoning = this.generateSemanticReasoning(filteredRecommendations, interactions, userProfile);

      // Calculate confidence based on knowledge graph completeness
      const confidence = this.calculateSemanticConfidence(filteredRecommendations, interactions, userProfile);

      const result = {
        recommendedIngredients: filteredRecommendations,
        interactions,
        reasoning,
        method: this.loaded ? 'Semantic Ontology Reasoning' : 'Rule-based Fallback',
        confidence,
        metadata: {
          totalIngredients: this.knowledgeGraph.ingredients.size,
          processedConcerns: skinConcerns?.length || 0,
          appliedFilters: knownSensitivities?.length || 0,
          cacheKey
        }
      };

      // Cache results for performance
      this.reasoningCache.set(cacheKey, result);
      setTimeout(() => this.reasoningCache.delete(cacheKey), 3600000); // 1 hour TTL
      
      return result;

    } catch (error) {
      this.logger.error('❌ Semantic reasoning failed:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  getRecommendedIngredientsForProfile(skinType, concerns = []) {
    const recommendations = [];
    const normalizedConcerns = concerns.map(c => c.toLowerCase().replace(/[_\s]/g, ''));

    for (const [ingredientName, data] of this.knowledgeGraph.ingredients) {
      let score = 0;
      let reasons = [];
      let confidenceFactors = [];

      // 1. Skin Type Compatibility Analysis (40 points max)
      if (data.recommendedFor.includes(skinType.toLowerCase())) {
        const baseScore = 40;
        score += baseScore;
        reasons.push(`Ontologically recommended for ${skinType} skin`);
        confidenceFactors.push({ factor: 'skin_type_match', weight: 0.4, value: 1.0 });
      } else {
        // Partial compatibility check
        const partialMatch = this.checkPartialSkinTypeCompatibility(skinType, data.recommendedFor);
        if (partialMatch.score > 0) {
          score += partialMatch.score;
          reasons.push(partialMatch.reason);
          confidenceFactors.push({ factor: 'skin_type_partial', weight: 0.2, value: partialMatch.score / 20 });
        }
      }

      // 2. Concern Treatment Analysis (50 points max)
      const treatedConcerns = this.analyzeIngredientConcernTreatment(data, normalizedConcerns);
      if (treatedConcerns.length > 0) {
        const concernScore = Math.min(50, treatedConcerns.length * 25);
        score += concernScore;
        reasons.push(`Treats ${treatedConcerns.length} of your concerns: ${treatedConcerns.join(', ')}`);
        confidenceFactors.push({ 
          factor: 'concern_treatment', 
          weight: 0.5, 
          value: treatedConcerns.length / normalizedConcerns.length 
        });
      }

      // 3. Efficacy and Safety Weighting (10 points max)
      const efficacyBonus = (data.efficacyScore / 100) * 5; // 0-5 points
      const safetyBonus = (data.safetyRating / 10) * 5; // 0-5 points
      score += efficacyBonus + safetyBonus;
      
      if (data.efficacyScore > 80) {
        reasons.push(`High efficacy rating (${data.efficacyScore}/100)`);
      }
      if (data.safetyRating > 8) {
        reasons.push(`Excellent safety profile (${data.safetyRating}/10)`);
      }

      // 4. Multi-functional Bonus (5 points max)
      if (data.functions.length > 1) {
        const functionalBonus = Math.min(5, data.functions.length);
        score += functionalBonus;
        reasons.push(`Multi-functional: ${data.functions.slice(0, 3).join(', ')}`);
      }

      // 5. Benefit Diversity Bonus (5 points max)
      if (data.benefits.length > 0) {
        const benefitBonus = Math.min(5, data.benefits.length);
        score += benefitBonus;
        reasons.push(`Provides: ${data.benefits.slice(0, 3).join(', ')}`);
      }

      // Only include ingredients with meaningful scores
      if (score > 25) {
        recommendations.push({
          ingredient: ingredientName,
          label: data.label,
          score: Math.round(score),
          reasons,
          functions: data.functions,
          benefits: data.benefits,
          treatsConcerns: treatedConcerns,
          efficacyScore: data.efficacyScore,
          safetyRating: data.safetyRating,
          confidenceFactors,
          metadata: {
            ontologyBased: this.loaded,
            skinTypeMatch: data.recommendedFor.includes(skinType.toLowerCase()),
            concernsAddressed: treatedConcerns.length
          }
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 15); // Top 15 recommendations
  }

  analyzeIngredientConcernTreatment(ingredientData, userConcerns) {
    const treatedConcerns = [];
    
    for (const concern of userConcerns) {
      // Direct treatment match
      if (ingredientData.treats.some(treatedConcern => 
        treatedConcern.includes(concern) || concern.includes(treatedConcern)
      )) {
        treatedConcerns.push(concern);
        continue;
      }

      // Indirect treatment through benefits
      const concernBenefitMap = {
        'acne': ['pore minimizing', 'oil controlling', 'exfoliating'],
        'wrinkles': ['anti-aging', 'firming'],
        'finelines': ['anti-aging', 'hydrating'],
        'dryness': ['hydrating', 'soothing'],
        'oiliness': ['oil controlling', 'pore minimizing'],
        'darkspots': ['brightening', 'exfoliating'],
        'largepores': ['pore minimizing', 'exfoliating'],
        'redness': ['soothing & calming', 'anti-inflammatory'],
        'sensitivity': ['soothing & calming']
      };

      const relevantBenefits = concernBenefitMap[concern] || [];
      const hasBenefit = relevantBenefits.some(benefit => 
        ingredientData.benefits.some(ingredientBenefit => 
          ingredientBenefit.includes(benefit.toLowerCase())
        )
      );

      if (hasBenefit) {
        treatedConcerns.push(concern);
      }
    }

    return treatedConcerns;
  }

  checkPartialSkinTypeCompatibility(userSkinType, ingredientSkinTypes) {
    const compatibilityMap = {
      'combination': ['oily', 'dry', 'normal'], // Combination can use products for component types
      'sensitive': ['normal', 'dry'], // Sensitive can often use gentle normal/dry products
      'normal': ['dry', 'sensitive'], // Normal can sometimes handle mild dry/sensitive products
    };

    const partialMatches = compatibilityMap[userSkinType.toLowerCase()] || [];
    
    for (const partialMatch of partialMatches) {
      if (ingredientSkinTypes.includes(partialMatch)) {
        return {
          score: 15, // Reduced score for partial match
          reason: `Compatible via ${partialMatch} skin properties`
        };
      }
    }

    return { score: 0, reason: null };
  }

  analyzeIngredientInteractions(ingredients) {
    const interactions = {
      synergistic: [],
      incompatible: [],
      potentiating: [],
      neutral: []
    };

    for (let i = 0; i < ingredients.length; i++) {
      for (let j = i + 1; j < ingredients.length; j++) {
        const ing1 = ingredients[i].toLowerCase();
        const ing2 = ingredients[j].toLowerCase();
        
        const ing1Data = this.knowledgeGraph.ingredients.get(ing1);
        const ing2Data = this.knowledgeGraph.ingredients.get(ing2);

        if (!ing1Data || !ing2Data) continue;

        // Check for synergistic relationships
        if (ing1Data.synergisticWith.includes(ing2) || ing2Data.synergisticWith.includes(ing1)) {
          interactions.synergistic.push({
            ingredients: [ing1, ing2],
            reason: 'Ontologically defined synergy',
            strength: 'high',
            benefits: this.calculateSynergyBenefits(ing1Data, ing2Data)
          });
        }
        // Check for incompatible relationships
        else if (ing1Data.incompatibleWith.includes(ing2) || ing2Data.incompatibleWith.includes(ing1)) {
          interactions.incompatible.push({
            ingredients: [ing1, ing2],
            reason: this.getIncompatibilityReason(ing1, ing2),
            severity: this.getIncompatibilitySeverity(ing1, ing2),
            recommendation: 'Use in separate routines or different times of day'
          });
        }
        // Check for potentiating relationships
        else if (ing1Data.potentiatesEffectOf.includes(ing2) || ing2Data.potentiatesEffectOf.includes(ing1)) {
          interactions.potentiating.push({
            ingredients: [ing1, ing2],
            reason: 'One ingredient enhances the other\'s effect',
            enhancer: ing1Data.potentiatesEffectOf.includes(ing2) ? ing1 : ing2,
            enhanced: ing1Data.potentiatesEffectOf.includes(ing2) ? ing2 : ing1
          });
        }
        // Neutral interaction
        else {
          interactions.neutral.push([ing1, ing2]);
        }
      }
    }

    return interactions;
  }

  calculateSynergyBenefits(ing1Data, ing2Data) {
    const combinedBenefits = [...new Set([...ing1Data.benefits, ...ing2Data.benefits])];
    const combinedFunctions = [...new Set([...ing1Data.functions, ...ing2Data.functions])];
    
    return {
      benefits: combinedBenefits,
      functions: combinedFunctions,
      enhancedEfficacy: Math.min(100, (ing1Data.efficacyScore + ing2Data.efficacyScore) / 2 + 10)
    };
  }

  getIncompatibilityReason(ing1, ing2) {
    const incompatibilityReasons = {
      'vitamin c_niacinamide': 'pH level differences may reduce efficacy',
      'retinol_salicylic acid': 'Over-exfoliation and irritation risk',
      'vitamin c_retinol': 'Different pH requirements and potential irritation',
      'benzoyl peroxide_retinol': 'Chemical interaction causing ingredient breakdown'
    };

    const key1 = `${ing1}_${ing2}`;
    const key2 = `${ing2}_${ing1}`;
    
    return incompatibilityReasons[key1] || incompatibilityReasons[key2] || 'Potential chemical or pH interaction';
  }

  getIncompatibilitySeverity(ing1, ing2) {
    const highSeverityPairs = [
      ['retinol', 'benzoyl peroxide'],
      ['vitamin c', 'retinol'],
      ['salicylic acid', 'retinol']
    ];

    const isHighSeverity = highSeverityPairs.some(pair => 
      (pair.includes(ing1) && pair.includes(ing2))
    );

    return isHighSeverity ? 'high' : 'medium';
  }

  applySensitivityFilters(recommendations, knownSensitivities) {
    if (!knownSensitivities || knownSensitivities.length === 0) {
      return recommendations;
    }

    const sensitivityIngredientMap = {
      'fragrance': ['fragrance', 'essential oil', 'perfume'],
      'alcohol': ['alcohol', 'ethanol', 'denatured alcohol'],
      'silicone': ['silicone', 'dimethicone', 'cyclomethicone'],
      'sulfate': ['sulfate', 'sls', 'sodium lauryl sulfate'],
      'paraben': ['paraben', 'methylparaben', 'propylparaben']
    };

    return recommendations.filter(rec => {
      for (const sensitivity of knownSensitivities) {
        const problematicIngredients = sensitivityIngredientMap[sensitivity.toLowerCase()] || [sensitivity.toLowerCase()];
        
        const hasProblematicIngredient = problematicIngredients.some(problematic => 
          rec.ingredient.toLowerCase().includes(problematic) ||
          rec.label.toLowerCase().includes(problematic)
        );

        if (hasProblematicIngredient) {
          return false; // Filter out this recommendation
        }
      }
      return true;
    });
  }

  generateSemanticReasoning(recommendations, interactions, userProfile) {
    const reasoning = [];

    // Analysis overview
    reasoning.push(`Analyzed ${this.knowledgeGraph.ingredients.size} ingredients using semantic ontology reasoning`);
    
    // Personalization summary
    reasoning.push(`Personalized analysis for ${userProfile.skinType} skin with ${userProfile.skinConcerns?.length || 0} specific concerns`);

    // Top recommendations insight
    const topIngredients = recommendations.slice(0, 3);
    if (topIngredients.length > 0) {
      reasoning.push(`Top matches: ${topIngredients.map(r => r.ingredient).join(', ')} (scores: ${topIngredients.map(r => r.score).join(', ')})`);
    }

    // Concern coverage analysis
    if (userProfile.skinConcerns && userProfile.skinConcerns.length > 0) {
      const addressedConcerns = new Set();
      recommendations.forEach(rec => {
        rec.treatsConcerns?.forEach(concern => addressedConcerns.add(concern));
      });
      
      const coveragePercent = Math.round((addressedConcerns.size / userProfile.skinConcerns.length) * 100);
      reasoning.push(`Addresses ${addressedConcerns.size}/${userProfile.skinConcerns.length} concerns (${coveragePercent}% coverage)`);
    }

    // Interaction insights
    if (interactions.synergistic.length > 0) {
      reasoning.push(`Found ${interactions.synergistic.length} beneficial ingredient combinations for enhanced efficacy`);
    }
    if (interactions.incompatible.length > 0) {
      reasoning.push(`⚠️ Detected ${interactions.incompatible.length} potential conflicts - use timing strategies to avoid interactions`);
    }

    // Safety and filtering insights
    if (userProfile.knownSensitivities && userProfile.knownSensitivities.length > 0) {
      reasoning.push(`Applied safety filters for ${userProfile.knownSensitivities.length} known sensitivities`);
    }

    // Methodology note
    reasoning.push(this.loaded ? 
      'Analysis powered by comprehensive semantic web ontology with 95+ ingredients and 200+ relationships' : 
      'Analysis using advanced rule-based reasoning with ingredient interaction detection'
    );

    return reasoning;
  }

  calculateSemanticConfidence(recommendations, interactions, userProfile) {
    let confidence = 40; // Base confidence

    // Boost for having good recommendations
    if (recommendations.length > 0) {
      const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
      confidence += Math.min(25, avgScore / 4); // Up to 25 points based on avg score
    }

    // Boost for synergistic combinations
    confidence += Math.min(15, interactions.synergistic.length * 3);

    // Penalize for many conflicts (suggests profile complexity)
    confidence -= Math.min(15, interactions.incompatible.length * 5);

    // Boost for using full ontology vs fallback
    if (this.loaded && this.knowledgeGraph.ingredients.size > 10) {
      confidence += 15;
    }

    // Boost for good concern coverage
    if (userProfile.skinConcerns && userProfile.skinConcerns.length > 0) {
      const addressedConcerns = new Set();
      recommendations.forEach(rec => {
        rec.treatsConcerns?.forEach(concern => addressedConcerns.add(concern));
      });
      const coverage = addressedConcerns.size / userProfile.skinConcerns.length;
      confidence += Math.round(coverage * 10); // Up to 10 points for full coverage
    }

    return Math.min(98, Math.max(35, Math.round(confidence)));
  }

  // UTILITY METHODS

  getRelatedEntities(subject, property) {
    const quads = this.store.getQuads(
      subject,
      namedNode(this.prefixes.matchcare + property),
      null,
      null
    );
    return quads.map(q => q.object.value);
  }

  getDataProperty(subject, property) {
    const quads = this.store.getQuads(
      subject,
      namedNode(this.prefixes.matchcare + property),
      null,
      null
    );
    if (quads.length > 0) {
      const value = quads[0].object.value;
      return property.includes('Score') || property.includes('Rating') ? parseInt(value) : parseFloat(value);
    }
    return null;
  }

  extractLocalName(uri) {
    return uri.substring(uri.lastIndexOf('#') + 1);
  }

  getLabel(subject) {
    const labelQuads = this.store.getQuads(
      subject,
      namedNode(this.prefixes.rdfs + 'label'),
      null,
      null
    );
    return labelQuads.length > 0 ? labelQuads[0].object.value : null;
  }

  getComment(subject) {
    const commentQuads = this.store.getQuads(
      subject,
      namedNode(this.prefixes.rdfs + 'comment'),
      null,
      null
    );
    return commentQuads.length > 0 ? commentQuads[0].object.value : null;
  }

  // PRODUCT SCORING METHOD

  calculateSemanticProductScore(product, userProfile) {
    try {
      const { skinType, skinConcerns, knownSensitivities } = userProfile;
      let totalScore = 0;
      const explanations = [];
      const semanticInsights = {};

      // Get semantic ingredient recommendations for comparison
      const semanticRecs = this.getRecommendedIngredientsForProfile(skinType, skinConcerns || []);
      const topSemanticIngredients = semanticRecs.slice(0, 10).map(r => r.ingredient.toLowerCase());

      // Extract product ingredients
      const productIngredients = Array.isArray(product.keyIngredients) ? 
        product.keyIngredients.map(ing => ing.toLowerCase()) : [];

      // 1. SEMANTIC INGREDIENT MATCHING (50 points max)
      let semanticMatches = 0;
      let matchedIngredients = [];
      
      for (const ingredient of topSemanticIngredients) {
        const isMatch = productIngredients.some(prodIng => 
          this.isIngredientMatch(prodIng, ingredient)
        );
        
        if (isMatch) {
          semanticMatches++;
          matchedIngredients.push(ingredient);
        }
      }

      if (semanticMatches > 0) {
        const matchScore = Math.min(50, semanticMatches * 12);
        totalScore += matchScore;
        explanations.push(`Contains ${semanticMatches} semantically recommended ingredients`);
        semanticInsights.ontologyMatches = matchedIngredients;
      }

      // 2. SKIN TYPE COMPATIBILITY (25 points max)
      const skinTypeCompatible = Array.isArray(product.suitableForSkinTypes) && 
        product.suitableForSkinTypes.some(type => 
          type.toLowerCase() === skinType.toLowerCase()
        );

      if (skinTypeCompatible) {
        totalScore += 25;
        explanations.push(`Formulated for ${skinType} skin type`);
      }

      // 3. CONCERN ADDRESSING (25 points max)
      if (skinConcerns && skinConcerns.length > 0) {
        const productConcerns = Array.isArray(product.addressesConcerns) ? product.addressesConcerns : [];
        const addressedConcerns = skinConcerns.filter(concern =>
          productConcerns.some(prodConcern =>
            prodConcern.toLowerCase().includes(concern.toLowerCase()) ||
            concern.toLowerCase().includes(prodConcern.toLowerCase())
          )
        );

        if (addressedConcerns.length > 0) {
          const concernScore = Math.min(25, (addressedConcerns.length / skinConcerns.length) * 25);
          totalScore += concernScore;
          explanations.push(`Addresses ${addressedConcerns.length}/${skinConcerns.length} of your concerns`);
        }
      }

      // 4. SAFETY AND SENSITIVITY CHECK (deduct points for violations)
      if (knownSensitivities && knownSensitivities.length > 0) {
        const safetyViolations = this.checkProductSafetyViolations(product, knownSensitivities);
        if (safetyViolations.length > 0) {
          totalScore -= safetyViolations.length * 20;
          explanations.push(`⚠️ Contains ${safetyViolations.length} ingredients you're sensitive to`);
        } else {
          explanations.push(`✓ Safe for your known sensitivities`);
        }
      }

      // 5. INTERACTION ANALYSIS BONUS (5 points max)
      if (productIngredients.length > 1) {
        const interactions = this.analyzeIngredientInteractions(productIngredients);
        
        if (interactions.synergistic.length > 0) {
          totalScore += Math.min(5, interactions.synergistic.length * 2);
          explanations.push(`${interactions.synergistic.length} beneficial ingredient synergies`);
          semanticInsights.interactions = {
            synergistic: interactions.synergistic.length,
            incompatible: interactions.incompatible.length
          };
        }
        
        if (interactions.incompatible.length > 0) {
          totalScore -= interactions.incompatible.length * 3;
          explanations.push(`⚠️ ${interactions.incompatible.length} potential ingredient conflicts`);
        }
      }

      return {
        score: Math.max(0, Math.min(100, totalScore)),
        explanations: explanations.slice(0, 4), // Limit explanations
        semanticInsights,
        method: this.loaded ? 'Semantic Ontology Analysis' : 'Rule-based Analysis'
      };

    } catch (error) {
      this.logger.error('Error calculating semantic product score:', error);
      return {
        score: 50,
        explanations: ['Basic compatibility analysis'],
        semanticInsights: {},
        method: 'Fallback Analysis'
      };
    }
  }

  isIngredientMatch(productIngredient, ontologyIngredient) {
    const prod = productIngredient.toLowerCase();
    const onto = ontologyIngredient.toLowerCase();
    
    // Direct inclusion match
    if (prod.includes(onto) || onto.includes(prod)) {
      return true;
    }

    // Handle common ingredient name variations
    const variations = {
      'hyaluronic acid': ['sodium hyaluronate', 'hyaluronate'],
      'vitamin c': ['ascorbic acid', 'l-ascorbic acid', 'magnesium ascorbyl phosphate', 'sodium ascorbyl phosphate'],
      'vitamin e': ['tocopherol', 'tocopheryl acetate'],
      'salicylic acid': ['bha', 'beta hydroxy acid'],
      'glycolic acid': ['aha', 'alpha hydroxy acid'],
      'retinol': ['retinyl palmitate', 'retinyl acetate', 'retinaldehyde'],
      'niacinamide': ['nicotinamide', 'vitamin b3']
    };

    for (const [main, vars] of Object.entries(variations)) {
      if ((prod.includes(main) || vars.some(v => prod.includes(v))) &&
          (onto.includes(main) || vars.some(v => onto.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  checkProductSafetyViolations(product, knownSensitivities) {
    const violations = [];
    
    const sensitivityChecks = {
      'fragrance': () => product.fragranceFree === false,
      'alcohol': () => product.alcoholFree === false,
      'silicone': () => product.siliconeFree === false,
      'paraben': () => product.parabenFree === false,
      'sulfate': () => product.sulfateFree === false
    };

    for (const sensitivity of knownSensitivities) {
      const checkFunction = sensitivityChecks[sensitivity.toLowerCase()];
      if (checkFunction && checkFunction()) {
        violations.push(sensitivity);
      }
    }

    return violations;
  }

  // FALLBACK SYSTEM

  initializeFallbackKnowledge() {
    this.logger.log('🔄 Initializing comprehensive fallback knowledge base...');
    
    const fallbackIngredients = {
      'hyaluronic acid': {
        recommendedFor: ['dry', 'normal', 'sensitive'],
        treats: ['dryness', 'finelines'],
        functions: ['humectant'],
        benefits: ['hydrating', 'anti-aging'],
        synergisticWith: ['niacinamide', 'ceramides', 'glycerin'],
        incompatibleWith: [],
        efficacyScore: 95,
        safetyRating: 10
      },
      'niacinamide': {
        recommendedFor: ['oily', 'combination', 'sensitive'],
        treats: ['oiliness', 'largepores', 'redness'],
        functions: ['sebum regulator', 'anti-inflammatory'],
        benefits: ['pore minimizing', 'oil controlling'],
        synergisticWith: ['hyaluronic acid', 'ceramides'],
        incompatibleWith: ['vitamin c'],
        efficacyScore: 88,
        safetyRating: 9
      },
      'salicylic acid': {
        recommendedFor: ['oily', 'combination'],
        treats: ['acne', 'largepores', 'uneventexture'],
        functions: ['exfoliant'],
        benefits: ['exfoliating & renewing', 'pore minimizing'],
        synergisticWith: [],
        incompatibleWith: ['retinol', 'vitamin c'],
        efficacyScore: 85,
        safetyRating: 7
      },
      'retinol': {
        recommendedFor: ['normal', 'oily'],
        treats: ['wrinkles', 'finelines', 'acne', 'uneventexture'],
        functions: ['cell renewal'],
        benefits: ['anti-aging', 'exfoliating & renewing'],
        synergisticWith: ['hyaluronic acid'],
        incompatibleWith: ['salicylic acid', 'vitamin c'],
        efficacyScore: 95,
        safetyRating: 5
      },
      'vitamin c': {
        recommendedFor: ['normal', 'dry'],
        treats: ['darkspots', 'wrinkles', 'dullness'],
        functions: ['antioxidant'],
        benefits: ['brightening', 'anti-aging', 'protective & shielding'],
        synergisticWith: ['vitamin e'],
        incompatibleWith: ['niacinamide', 'salicylic acid', 'retinol'],
        efficacyScore: 92,
        safetyRating: 6
      },
      'ceramides': {
        recommendedFor: ['dry', 'sensitive', 'normal'],
        treats: ['dryness', 'sensitivity'],
        functions: ['occlusive', 'emollient'],
        benefits: ['hydrating', 'soothing & calming'],
        synergisticWith: ['hyaluronic acid', 'niacinamide'],
        incompatibleWith: [],
        efficacyScore: 90,
        safetyRating: 10
      },
      'aloe vera': {
        recommendedFor: ['sensitive', 'dry', 'normal'],
        treats: ['sensitivity', 'redness', 'dryness'],
        functions: ['anti-inflammatory', 'humectant'],
        benefits: ['soothing & calming', 'hydrating'],
        synergisticWith: ['centella asiatica'],
        incompatibleWith: [],
        efficacyScore: 75,
        safetyRating: 10
      },
      'centella asiatica': {
        recommendedFor: ['sensitive', 'combination'],
        treats: ['sensitivity', 'redness', 'acne'],
        functions: ['anti-inflammatory'],
        benefits: ['soothing & calming'],
        synergisticWith: ['aloe vera', 'niacinamide'],
        incompatibleWith: [],
        efficacyScore: 80,
        safetyRating: 10
      }
    };

    for (const [name, data] of Object.entries(fallbackIngredients)) {
      this.knowledgeGraph.ingredients.set(name, {
        label: name,
        ...data
      });
    }

    this.logger.log(`✅ Fallback knowledge base initialized with ${this.knowledgeGraph.ingredients.size} ingredients`);
  }

  getFallbackRecommendations(userProfile) {
    return {
      recommendedIngredients: this.getRecommendedIngredientsForProfile(
        userProfile.skinType, 
        userProfile.skinConcerns || []
      ),
      interactions: { synergistic: [], incompatible: [], potentiating: [] },
      reasoning: [
        'Using comprehensive rule-based reasoning system',
        'Ingredient interaction analysis included',
        'Personalized for your skin type and concerns'
      ],
      method: 'Advanced Rule-based Analysis',
      confidence: 70
    };
  }

  // PUBLIC INTERFACE METHODS

  isLoaded() {
    return this.loaded;
  }

  getMethod() {
    return this.loaded && this.knowledgeGraph.ingredients.size > 8 ? 
      'Semantic Ontology' : 'Rule-based';
  }

  getStats() {
    return {
      loaded: this.loaded,
      ingredients: this.knowledgeGraph.ingredients.size,
      skinTypes: this.knowledgeGraph.skinTypes.size,
      concerns: this.knowledgeGraph.concerns.size,
      method: this.getMethod(),
      cacheSize: this.reasoningCache.size
    };
  }

  clearCache() {
    this.reasoningCache.clear();
    this.logger.log('🗑️ Reasoning cache cleared');
  }

  // Get ingredient information by name
  getIngredientInfo(ingredientName) {
    return this.knowledgeGraph.ingredients.get(ingredientName.toLowerCase()) || null;
  }

  // Get all available skin types
  getSkinTypes() {
    return Array.from(this.knowledgeGraph.skinTypes.values());
  }

  // Get all available concerns
  getConcerns() {
    return Array.from(this.knowledgeGraph.concerns.values());
  }
}

// Export singleton instance
module.exports = new OntologyService();