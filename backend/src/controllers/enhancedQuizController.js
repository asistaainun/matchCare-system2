const { UserProfile, User, GuestSession } = require('../models');
const semanticRecommendationEngine = require('../services/semanticRecommendationEngine');
const ontologyService = require('../services/ontologyService');
const { validationResult } = require('express-validator');

class EnhancedQuizController {
  
  // Get comprehensive quiz questions
  async getQuizQuestions(req, res) {
    try {
      const questions = [
        {
          id: 'skin_type',
          title: 'What kind of skin type is yours?',
          type: 'single_choice',
          required: true,
          options: [
            { 
              value: 'normal', 
              label: 'Normal', 
              description: 'Balanced, not too oily or dry, minimal issues',
              icon: '😊'
            },
            { 
              value: 'dry', 
              label: 'Dry', 
              description: 'Often feels tight, may have flaky patches, needs moisture',
              icon: '🏜️'
            },
            { 
              value: 'oily', 
              label: 'Oily', 
              description: 'Shiny appearance, enlarged pores, prone to breakouts',
              icon: '✨'
            },
            { 
              value: 'combination', 
              label: 'Combination', 
              description: 'Oily T-zone (forehead, nose, chin), normal/dry cheeks',
              icon: '🎭'
            },
            { 
              value: 'sensitive', 
              label: 'Sensitive', 
              description: 'Easily irritated, reactive to products, prone to redness',
              icon: '🌹'
            },
            { 
              value: 'unsure', 
              label: "I'm not sure with my skin type", 
              description: 'Take a quick assessment to determine your type',
              icon: '🤔'
            }
          ]
        },
        
        // Conditional skin type assessment questions
        {
          id: 'morning_feeling',
          title: 'How does your skin feel when you wake up in the morning?',
          type: 'single_choice',
          condition: { skin_type: 'unsure' },
          required: true,
          options: [
            { value: 'tight_dry', label: 'Tight, dry, maybe flaky' },
            { value: 'normal_balanced', label: 'Normal, comfortable, balanced' },
            { value: 'oily_shiny', label: 'Oily or shiny, especially on T-zone' },
            { value: 'combination', label: 'Dry or normal on cheeks, oily in T-zone' }
          ]
        },
        {
          id: 'after_washing',
          title: 'How does your skin feel a few hours after washing your face?',
          type: 'single_choice',
          condition: { skin_type: 'unsure' },
          required: true,
          options: [
            { value: 'tight_rough', label: 'Tight or rough, sometimes flaky' },
            { value: 'balanced', label: 'Balanced, neither oily nor dry' },
            { value: 'oily_tzone', label: 'Oily and shiny, especially in the T-zone' },
            { value: 'oily_tzone_dry_cheeks', label: 'Oily in T-zone, dry or normal on other areas' }
          ]
        },
        {
          id: 'oily_shine',
          title: 'How often do you get oily shine during the day?',
          type: 'single_choice',
          condition: { skin_type: 'unsure' },
          required: true,
          options: [
            { value: 'rarely_dry', label: 'Rarely, skin feels dry' },
            { value: 'rarely_balanced', label: 'Rarely, skin looks balanced' },
            { value: 'often_shiny', label: 'Often, skin looks shiny or greasy' },
            { value: 'tzone_only', label: 'Only in some areas, mostly T-zone' }
          ]
        },
        {
          id: 'flaky_patches',
          title: 'Do you experience flaky or rough patches?',
          type: 'single_choice',
          condition: { skin_type: 'unsure' },
          required: true,
          options: [
            { value: 'yes_frequently', label: 'Yes, frequently' },
            { value: 'rarely', label: 'Rarely' },
            { value: 'almost_never', label: 'Almost never' },
            { value: 'sometimes_cheeks', label: 'Sometimes on cheeks only' }
          ]
        },

        // Main concerns selection
        {
          id: 'skin_concerns',
          title: 'What are your main skin concerns? (Select all that apply)',
          type: 'multiple_choice',
          required: false,
          maxSelections: 6,
          options: [
            { 
              value: 'acne', 
              label: 'Acne', 
              description: 'Pimples, blackheads, whiteheads, breakouts',
              category: 'blemishes'
            },
            { 
              value: 'wrinkles', 
              label: 'Wrinkles', 
              description: 'Deep lines and creases, signs of aging',
              category: 'aging'
            },
            { 
              value: 'fine_lines', 
              label: 'Fine Lines', 
              description: 'Small, surface-level lines around eyes/mouth',
              category: 'aging'
            },
            { 
              value: 'sensitivity', 
              label: 'Sensitivity', 
              description: 'Redness, irritation, reactions to products',
              category: 'reactive'
            },
            { 
              value: 'dryness', 
              label: 'Dryness', 
              description: 'Flaky, tight, rough patches, dehydration',
              category: 'moisture'
            },
            { 
              value: 'oiliness', 
              label: 'Excess Oil', 
              description: 'Shiny, greasy appearance, frequent blotting needed',
              category: 'oil'
            },
            { 
              value: 'redness', 
              label: 'Redness', 
              description: 'Persistent red areas, irritation, inflammation',
              category: 'reactive'
            },
            { 
              value: 'large_pores', 
              label: 'Large Pores', 
              description: 'Visible, enlarged pores, especially on nose/cheeks',
              category: 'texture'
            },
            { 
              value: 'dullness', 
              label: 'Dullness', 
              description: 'Lack of radiance, tired-looking skin',
              category: 'appearance'
            },
            { 
              value: 'uneven_texture', 
              label: 'Uneven Texture', 
              description: 'Rough, bumpy, or irregular skin surface',
              category: 'texture'
            },
            { 
              value: 'dark_spots', 
              label: 'Dark Spots', 
              description: 'Hyperpigmentation, age spots, acne marks',
              category: 'pigmentation'
            },
            { 
              value: 'dark_undereyes', 
              label: 'Dark Under Eyes', 
              description: 'Dark circles, under-eye discoloration',
              category: 'eye_area'
            }
          ]
        },

        // Sensitivity assessment
        {
          id: 'known_sensitivities',
          title: 'Do you have any known sensitivities or allergies?',
          type: 'multiple_choice',
          required: false,
          maxSelections: 5,
          options: [
            { 
              value: 'fragrance', 
              label: 'Fragrance', 
              description: 'Perfumes, essential oils, synthetic fragrances',
              severity: 'high'
            },
            { 
              value: 'alcohol', 
              label: 'Alcohol', 
              description: 'Drying alcohols like denatured alcohol (alcohol denat)',
              severity: 'medium'
            },
            { 
              value: 'silicone', 
              label: 'Silicones', 
              description: 'Dimethicone, cyclomethicone, other silicone compounds',
              severity: 'low'
            },
            { 
              value: 'sulfate', 
              label: 'Sulfates', 
              description: 'SLS, SLES in cleansers, harsh detergents',
              severity: 'medium'
            },
            { 
              value: 'paraben', 
              label: 'Parabens', 
              description: 'Preservatives like methylparaben, propylparaben',
              severity: 'low'
            },
            { 
              value: 'none', 
              label: 'No Known Sensitivities', 
              description: 'No reactions or sensitivities identified',
              exclusive: true
            }
          ]
        },

        // Routine preferences
        {
          id: 'routine_complexity',
          title: 'How complex would you like your skincare routine to be?',
          type: 'single_choice',
          required: false,
          options: [
            { 
              value: 'simple', 
              label: 'Simple (3-4 products)', 
              description: 'Basic cleanse, treat, moisturize routine',
              timeCommitment: '5-10 minutes'
            },
            { 
              value: 'moderate', 
              label: 'Moderate (5-7 products)', 
              description: 'Multi-step with serums and targeted treatments',
              timeCommitment: '10-15 minutes'
            },
            { 
              value: 'advanced', 
              label: 'Advanced (8+ products)', 
              description: 'Complex routine with multiple actives and layers',
              timeCommitment: '15+ minutes'
            }
          ]
        },

        // Budget considerations
        {
          id: 'budget_range',
          title: 'What\'s your preferred budget range for skincare products?',
          type: 'single_choice',
          required: false,
          options: [
            { value: 'budget', label: 'Budget-friendly', description: 'Under Rp 200,000 per product' },
            { value: 'mid_range', label: 'Mid-range', description: 'Rp 200,000 - 500,000 per product' },
            { value: 'premium', label: 'Premium', description: 'Rp 500,000+ per product' },
            { value: 'no_preference', label: 'No specific preference', description: 'Quality over price' }
          ]
        }
      ];

      res.json({
        success: true,
        data: {
          questions,
          metadata: {
            totalQuestions: questions.length,
            estimatedTime: '3-5 minutes',
            version: '2.0-semantic'
          }
        }
      });

    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz questions',
        error: error.message
      });
    }
  }

  // Process quiz with enhanced semantic analysis
  async processQuizWithSemantics(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quiz data',
          errors: errors.array()
        });
      }

      const { responses, userId, saveProfile = false } = req.body;
      
      console.log('🧬 Processing quiz with semantic enhancement...');
      console.log('📝 Quiz responses:', JSON.stringify(responses, null, 2));

      // 1. Process and validate responses
      const processedResponses = this.validateAndProcessResponses(responses);
      if (!processedResponses.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quiz responses',
          details: processedResponses.errors
        });
      }

      // 2. Determine final skin type (with assessment logic if needed)
      const skinType = responses.skin_type === 'unsure' 
        ? this.calculateSkinTypeFromAssessment(responses)
        : responses.skin_type;

      // 3. Build comprehensive user profile
      const profileData = {
        skinType,
        skinConcerns: this.normalizeConcerns(responses.skin_concerns || []),
        knownSensitivities: this.normalizeSensitivities(responses.known_sensitivities || []),
        routineComplexity: responses.routine_complexity || 'moderate',
        budgetRange: responses.budget_range || 'no_preference',
        preferences: {
          assessmentMethod: responses.skin_type === 'unsure' ? 'calculated' : 'selected',
          concernPriority: this.calculateConcernPriority(responses.skin_concerns || []),
          safetyPriority: (responses.known_sensitivities || []).length > 0 ? 'high' : 'medium'
        }
      };

      console.log('👤 Generated profile:', JSON.stringify(profileData, null, 2));

      // 4. Ensure ontology service is loaded
      if (!ontologyService.isLoaded()) {
        console.log('🔄 Loading ontology service...');
        await ontologyService.loadOntology();
      }

      // 5. Generate comprehensive semantic analysis
      const semanticAnalysis = await ontologyService.getSemanticRecommendations(profileData);
      console.log(`💡 Semantic analysis method: ${semanticAnalysis.method}`);
      console.log(`📊 Confidence: ${semanticAnalysis.confidence}%`);

      // 6. Handle user profile storage and recommendations
      let profile;
      let recommendations = [];
      let sessionId = null;

      if (userId && userId !== 'guest') {
        // Authenticated user flow
        profile = await this.handleAuthenticatedUser(userId, profileData, saveProfile);
        
        // Generate full semantic recommendations
        const recommendationResult = await semanticRecommendationEngine.generateRecommendations(
          userId,
          { 
            limit: 15, 
            strictMode: profileData.knownSensitivities?.length > 2,
            category: null 
          }
        );
        recommendations = recommendationResult.recommendations;
        
      } else {
        // Guest user flow
        const guestResult = await this.handleGuestUser(profileData, semanticAnalysis);
        profile = guestResult.profile;
        sessionId = guestResult.sessionId;
        recommendations = guestResult.recommendations;
      }

      // 7. Build comprehensive response
      const response = {
        success: true,
        profile: {
          ...profileData,
          id: profile?.id,
          sessionId,
          confidence: this.calculateProfileConfidence(responses, profileData),
          completeness: this.calculateProfileCompleteness(profileData)
        },
        semanticAnalysis: {
          method: semanticAnalysis.method,
          confidence: semanticAnalysis.confidence,
          recommendedIngredients: semanticAnalysis.recommendedIngredients.slice(0, 10),
          interactions: semanticAnalysis.interactions,
          reasoning: semanticAnalysis.reasoning,
          stats: ontologyService.getStats()
        },
        recommendations: recommendations.slice(0, 12),
        insights: {
          skinTypeReasoning: this.generateSkinTypeReasoning(responses, skinType),
          topIngredients: semanticAnalysis.recommendedIngredients.slice(0, 5),
          ingredientEducation: this.generateIngredientEducation(
            semanticAnalysis.recommendedIngredients.slice(0, 3)
          ),
          safetyTips: this.generatePersonalizedSafetyTips(profileData),
          routineRecommendations: this.generateRoutineRecommendations(profileData),
          concernPrioritization: this.generateConcernPrioritization(profileData)
        },
        nextSteps: this.generateNextSteps(profileData, userId),
        metadata: {
          version: '2.0-semantic',
          processingTime: Date.now(),
          ontologyEnabled: semanticAnalysis.method.includes('Ontology'),
          userType: userId && userId !== 'guest' ? 'authenticated' : 'guest',
          dataQuality: processedResponses.quality,
          responseCount: Object.keys(responses).length
        }
      };

      console.log(`✅ Generated response with ${recommendations.length} recommendations`);
      res.json(response);

    } catch (error) {
      console.error('❌ Enhanced quiz processing failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process quiz with semantic analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        fallback: true
      });
    }
  }

  // === QUIZ PROCESSING UTILITIES ===

  validateAndProcessResponses(responses) {
    const errors = [];
    let quality = 100;

    // Required field validation
    if (!responses.skin_type) {
      errors.push('Skin type is required');
      quality -= 30;
    }

    // Conditional validation for skin type assessment
    if (responses.skin_type === 'unsure') {
      const assessmentFields = ['morning_feeling', 'after_washing', 'oily_shine', 'flaky_patches'];
      const missingFields = assessmentFields.filter(field => !responses[field]);
      
      if (missingFields.length > 0) {
        errors.push(`Missing skin assessment data: ${missingFields.join(', ')}`);
        quality -= missingFields.length * 15;
      }
    }

    // Data quality assessment
    if (!responses.skin_concerns || responses.skin_concerns.length === 0) {
      quality -= 20; // No concerns specified
    }

    if (!responses.known_sensitivities || responses.known_sensitivities.length === 0) {
      quality -= 10; // No sensitivity info
    }

    return {
      valid: errors.length === 0,
      errors,
      quality: Math.max(0, quality)
    };
  }

  calculateSkinTypeFromAssessment(responses) {
    console.log('🔍 Calculating skin type from assessment responses...');
    
    const scores = { dry: 0, normal: 0, oily: 0, combination: 0 };

    // Morning feeling analysis (weight: 3)
    const morningWeights = {
      'tight_dry': { dry: 3 },
      'normal_balanced': { normal: 3 },
      'oily_shiny': { oily: 3 },
      'combination': { combination: 3 }
    };
    this.addWeightedScores(scores, morningWeights[responses.morning_feeling] || {});

    // After washing analysis (weight: 2)
    const washingWeights = {
      'tight_rough': { dry: 2 },
      'balanced': { normal: 2 },
      'oily_tzone': { oily: 2 },
      'oily_tzone_dry_cheeks': { combination: 2 }
    };
    this.addWeightedScores(scores, washingWeights[responses.after_washing] || {});

    // Oily shine frequency analysis (weight: 2)
    const shineWeights = {
      'rarely_dry': { dry: 2 },
      'rarely_balanced': { normal: 2 },
      'often_shiny': { oily: 2 },
      'tzone_only': { combination: 2 }
    };
    this.addWeightedScores(scores, shineWeights[responses.oily_shine] || {});

    // Flaky patches analysis (weight: 1)
    const flakyWeights = {
      'yes_frequently': { dry: 2 },
      'rarely': { normal: 1 },
      'almost_never': { oily: 1 },
      'sometimes_cheeks': { combination: 1 }
    };
    this.addWeightedScores(scores, flakyWeights[responses.flaky_patches] || {});

    // Determine skin type from highest score
    const maxScore = Math.max(...Object.values(scores));
    const skinType = Object.keys(scores).find(type => scores[type] === maxScore) || 'normal';
    
    console.log('📊 Skin type assessment scores:', scores, '→ Result:', skinType);
    return skinType;
  }

  addWeightedScores(current, toAdd) {
    Object.entries(toAdd).forEach(([key, value]) => {
      current[key] = (current[key] || 0) + value;
    });
  }

  normalizeConcerns(concerns) {
    if (!Array.isArray(concerns)) return [];
    
    // Normalize concern names and filter out invalid ones
    const validConcerns = [
      'acne', 'wrinkles', 'fine_lines', 'sensitivity', 'dryness', 
      'oiliness', 'redness', 'large_pores', 'dullness', 
      'uneven_texture', 'dark_spots', 'dark_undereyes'
    ];
    
    return concerns
      .map(concern => concern.toLowerCase().replace(/\s+/g, '_'))
      .filter(concern => validConcerns.includes(concern))
      .slice(0, 6); // Limit to 6 concerns max
  }

  normalizeSensitivities(sensitivities) {
    if (!Array.isArray(sensitivities)) return [];
    
    // Handle "none" option
    if (sensitivities.includes('none')) {
      return [];
    }
    
    const validSensitivities = ['fragrance', 'alcohol', 'silicone', 'sulfate', 'paraben'];
    
    return sensitivities
      .map(sensitivity => sensitivity.toLowerCase())
      .filter(sensitivity => validSensitivities.includes(sensitivity))
      .slice(0, 5); // Limit to 5 sensitivities max
  }

  calculateConcernPriority(concerns) {
    const priorityMap = {
      'acne': 'high',
      'sensitivity': 'high',
      'redness': 'high',
      'wrinkles': 'medium',
      'fine_lines': 'medium',
      'dark_spots': 'medium',
      'dryness': 'medium',
      'oiliness': 'medium',
      'large_pores': 'low',
      'dullness': 'low',
      'uneven_texture': 'low',
      'dark_undereyes': 'low'
    };

    const priorities = concerns.map(concern => priorityMap[concern] || 'low');
    
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  // === USER HANDLING ===

  async handleAuthenticatedUser(userId, profileData, saveProfile) {
    try {
      if (saveProfile) {
        // Create or update user profile
        const [profile, created] = await UserProfile.upsert({
          userId,
          ...profileData,
          lastQuizDate: new Date(),
          profileVersion: '2.0'
        });

        console.log(`📝 User profile ${created ? 'created' : 'updated'} for user ${userId}`);
        return profile;
      } else {
        // Temporary profile for session only
        return {
          id: null,
          userId,
          temporary: true,
          ...profileData
        };
      }
    } catch (error) {
      console.error('Error handling authenticated user:', error);
      throw error;
    }
  }

  async handleGuestUser(profileData, semanticAnalysis) {
    try {
      const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create guest session record
      const guestSession = await GuestSession.create({
        sessionId,
        profileData,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      });

      // Generate simplified recommendations for guest
      const recommendations = await this.generateGuestRecommendations(profileData, semanticAnalysis);

      return {
        profile: guestSession,
        sessionId,
        recommendations
      };
    } catch (error) {
      console.error('Error handling guest user:', error);
      throw error;
    }
  }

  async generateGuestRecommendations(profileData, semanticAnalysis) {
    console.log('👤 Generating guest recommendations...');
    
    try {
      // Use quick recommendations from semantic engine
      return await semanticRecommendationEngine.getQuickRecommendations(
        profileData.skinType,
        profileData.skinConcerns,
        12
      );
    } catch (error) {
      console.error('Error generating guest recommendations:', error);
      return [];
    }
  }

  // === INSIGHT GENERATION ===

  calculateProfileConfidence(responses, profileData) {
    let confidence = 50;

    // Skin type determination confidence
    if (responses.skin_type !== 'unsure') {
      confidence += 20; // Direct selection
    } else {
      confidence += 15; // Assessment-based
    }

    // Concerns specification confidence
    if (profileData.skinConcerns && profileData.skinConcerns.length > 0) {
      confidence += Math.min(20, profileData.skinConcerns.length * 4);
    }

    // Sensitivity information confidence
    if (profileData.knownSensitivities && profileData.knownSensitivities.length > 0) {
      confidence += 10;
    }

    // Routine preferences confidence
    if (responses.routine_complexity) {
      confidence += 5;
    }

    // Penalty for too many sensitivities (complex profile)
    if (profileData.knownSensitivities && profileData.knownSensitivities.length > 3) {
      confidence -= 5;
    }

    return Math.min(95, Math.max(35, confidence));
  }

  calculateProfileCompleteness(profileData) {
    let completeness = 0;
    const fields = [
      'skinType',
      'skinConcerns',
      'knownSensitivities',
      'routineComplexity',
      'budgetRange'
    ];

    fields.forEach(field => {
      if (profileData[field] && 
          (Array.isArray(profileData[field]) ? profileData[field].length > 0 : true)) {
        completeness += 20;
      }
    });

    return completeness;
  }

  generateSkinTypeReasoning(responses, skinType) {
    if (responses.skin_type !== 'unsure') {
      return `You identified your skin type as ${skinType}`;
    }

    const reasoningMap = {
      dry: 'Based on your responses, your skin tends to feel tight and may have flaky patches, indicating dryness',
      oily: 'Your responses suggest excess oil production throughout the day, particularly in the T-zone area',
      combination: 'You show mixed characteristics - oily in some areas (T-zone), normal or dry in others (cheeks)',
      normal: 'Your responses indicate well-balanced skin without excess oil or persistent dryness',
      sensitive: 'Your skin shows signs of sensitivity and may react to certain ingredients or environmental factors'
    };

    return reasoningMap[skinType] || `Assessment indicates ${skinType} skin type based on your responses`;
  }

  generateIngredientEducation(topIngredients) {
    return topIngredients.map(ingredient => ({
      name: ingredient.label || ingredient.ingredient,
      score: ingredient.score,
      benefits: ingredient.reasons || [],
      functions: ingredient.functions || [],
      treatsConcerns: ingredient.treatsConcerns || [],
      efficacy: ingredient.efficacyScore || 'Not specified',
      safety: ingredient.safetyRating || 'Not specified',
      whyRecommended: `Semantic confidence: ${ingredient.score}/100 - ${(ingredient.reasons || []).slice(0, 2).join(', ')}`,
      usage: this.getIngredientUsageTips(ingredient.ingredient)
    }));
  }

  getIngredientUsageTips(ingredientName) {
    const usageTips = {
      'hyaluronic acid': 'Apply to damp skin and follow with moisturizer to lock in hydration',
      'niacinamide': 'Can be used morning and night, pairs well with most ingredients',
      'retinol': 'Start slowly (2-3 times per week), use at night only, always follow with SPF during day',
      'vitamin c': 'Use in morning routine, may cause initial tingling, store in cool, dark place',
      'salicylic acid': 'Start with lower concentrations, avoid over-exfoliation, use SPF during day'
    };

    return usageTips[ingredientName.toLowerCase()] || 'Follow product instructions and patch test before use';
  }

  generatePersonalizedSafetyTips(profileData) {
    const tips = [];

    // Skin type specific tips
    switch (profileData.skinType) {
      case 'dry':
        tips.push('Look for hydrating ingredients like hyaluronic acid and ceramides');
        tips.push('Avoid products with high alcohol content that can further dry your skin');
        tips.push('Use lukewarm water when cleansing to prevent moisture loss');
        break;
      case 'oily':
        tips.push('Choose non-comedogenic products that won\'t clog pores');
        tips.push('Use gentle, oil-free cleansers to remove excess sebum');
        tips.push('Don\'t skip moisturizer - even oily skin needs hydration');
        break;
      case 'combination':
        tips.push('Consider using different products for different areas of your face');
        tips.push('Focus on balancing ingredients like niacinamide');
        tips.push('Use gentle exfoliation in the T-zone only');
        break;
      case 'sensitive':
        tips.push('Always patch test new products before full application');
        tips.push('Introduce new products one at a time');
        tips.push('Look for fragrance-free and hypoallergenic formulations');
        break;
      case 'normal':
        tips.push('Focus on maintaining your skin barrier with consistent care');
        tips.push('Consider preventive ingredients like antioxidants');
        tips.push('Establish a simple, consistent routine');
        break;
    }

    // Sensitivity-specific tips
    if (profileData.knownSensitivities) {
      if (profileData.knownSensitivities.includes('fragrance')) {
        tips.push('Always choose fragrance-free products to avoid irritation');
      }
      if (profileData.knownSensitivities.includes('alcohol')) {
        tips.push('Avoid products with denatured alcohol (alcohol denat) which can be drying');
      }
      if (profileData.knownSensitivities.includes('sulfate')) {
        tips.push('Choose sulfate-free cleansers to prevent stripping your skin');
      }
    }

    // Concern-specific tips
    if (profileData.skinConcerns) {
      if (profileData.skinConcerns.includes('acne')) {
        tips.push('Don\'t over-cleanse or use too many active ingredients at once');
      }
      if (profileData.skinConcerns.includes('wrinkles') || profileData.skinConcerns.includes('fine_lines')) {
        tips.push('Daily SPF use is crucial for preventing further aging');
      }
    }

    return tips.slice(0, 6); // Limit to 6 most relevant tips
  }

  generateRoutineRecommendations(profileData) {
    const routine = {
      morning: [],
      evening: [],
      weekly: []
    };

    // Base routine for all skin types
    routine.morning.push('Gentle cleanser', 'Serum (if using)', 'Moisturizer', 'SPF 30+');
    routine.evening.push('Cleanser', 'Treatment (if using)', 'Moisturizer');

    // Skin type specific adjustments
    switch (profileData.skinType) {
      case 'dry':
        routine.morning[0] = 'Gentle, hydrating cleanser';
        routine.evening.push('Face oil (optional)');
        break;
      case 'oily':
        routine.morning[0] = 'Foaming or gel cleanser';
        routine.evening.unshift('Double cleanse (if wearing makeup/sunscreen)');
        break;
      case 'combination':
        routine.weekly.push('Gentle exfoliation (T-zone focus)');
        break;
      case 'sensitive':
        routine.morning[0] = 'Extra gentle, fragrance-free cleanser';
        routine.weekly.push('Weekly hydrating mask');
        break;
    }

    // Concern-specific additions
    if (profileData.skinConcerns) {
      if (profileData.skinConcerns.includes('acne')) {
        routine.weekly.push('BHA exfoliant (2-3x per week)');
      }
      if (profileData.skinConcerns.includes('wrinkles') || profileData.skinConcerns.includes('fine_lines')) {
        routine.evening[1] = 'Retinol or retinoid (start slowly)';
      }
      if (profileData.skinConcerns.includes('dark_spots')) {
        routine.morning[1] = 'Vitamin C serum';
      }
    }

    return routine;
  }

  generateConcernPrioritization(profileData) {
    if (!profileData.skinConcerns || profileData.skinConcerns.length === 0) {
      return null;
    }

    const priorityOrder = [
      'sensitivity', 'acne', 'redness', // Immediate concerns
      'dryness', 'oiliness', // Balance concerns
      'wrinkles', 'fine_lines', 'dark_spots', // Aging concerns
      'large_pores', 'uneven_texture', 'dullness', 'dark_undereyes' // Cosmetic concerns
    ];

    const userConcerns = profileData.skinConcerns;
    const prioritized = priorityOrder.filter(concern => userConcerns.includes(concern));
    const remaining = userConcerns.filter(concern => !priorityOrder.includes(concern));

    return {
      immediate: prioritized.slice(0, 2),
      secondary: prioritized.slice(2, 4),
      longTerm: [...prioritized.slice(4), ...remaining],
      advice: 'Focus on immediate concerns first, then gradually address secondary and long-term goals'
    };
  }

  generateNextSteps(profileData, userId) {
    const steps = [];

    if (!userId || userId === 'guest') {
      steps.push({
        action: 'Create Account',
        description: 'Save your profile and get personalized tracking',
        priority: 'high',
        url: '/register'
      });
    }

    steps.push({
      action: 'Explore Recommendations',
      description: 'View products matched to your skin profile',
      priority: 'high',
      url: '/products'
    });

    if (profileData.skinConcerns && profileData.skinConcerns.length > 0) {
      steps.push({
        action: 'Learn About Ingredients',
        description: 'Understand the recommended ingredients for your concerns',
        priority: 'medium',
        url: '/ingredients'
      });
    }

    steps.push({
      action: 'Build Your Routine',
      description: 'Create a personalized skincare routine',
      priority: 'medium',
      url: '/routine-builder'
    });

    if (profileData.knownSensitivities && profileData.knownSensitivities.length > 0) {
      steps.push({
        action: 'Safety Guide',
        description: 'Learn how to avoid ingredients you\'re sensitive to',
        priority: 'low',
        url: '/safety-guide'
      });
    }

    return steps;
  }

  // === FALLBACK METHODS ===

  async getQuizHistory(req, res) {
    try {
      const { userId } = req.user;

      const profiles = await UserProfile.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: profiles.map(profile => ({
          id: profile.id,
          skinType: profile.skinType,
          skinConcerns: profile.skinConcerns,
          createdAt: profile.createdAt,
          version: profile.profileVersion || '1.0'
        }))
      });

    } catch (error) {
      console.error('Error fetching quiz history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quiz history'
      });
    }
  }
}

module.exports = new EnhancedQuizController();