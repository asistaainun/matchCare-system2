const express = require('express');
const { body, validationResult } = require('express-validator');
const enhancedRecommendationService = require('../services/enhancedRecommendationService');
const { UserProfile } = require('../models');
const router = express.Router();

// Guest Quiz Endpoint (No Login Required)
router.post('/guest-analysis', [
  body('skinType').isIn(['normal', 'dry', 'oily', 'combination', 'sensitive']),
  body('skinConcerns').isArray().optional(),
  body('knownSensitivities').isArray().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz data',
        errors: errors.array()
      });
    }

    const { skinType, skinConcerns, knownSensitivities, preferences } = req.body;
    
    const userProfile = {
      skinType,
      skinConcerns: skinConcerns || [],
      knownSensitivities: knownSensitivities || [],
      preferredBrands: preferences?.brands || []
    };

    console.log('🎯 Processing guest quiz:', userProfile);

    const recommendations = await enhancedRecommendationService
      .getPersonalizedRecommendations(userProfile, {
        limit: 15,
        category: preferences?.category
      });

    res.json({
      success: true,
      data: {
        userProfile,
        recommendations: recommendations.recommendations,
        insights: recommendations.semanticInsights,
        totalFound: recommendations.recommendations.length
      }
    });

  } catch (error) {
    console.error('❌ Quiz analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze quiz results',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Determine Skin Type Helper Endpoint
router.post('/determine-skin-type', [
  body('answers').isArray().isLength({ min: 4, max: 4 })
], async (req, res) => {
  try {
    const { answers } = req.body;
    
    // Scoring logic for skin type determination
    const scores = { a: 0, b: 0, c: 0, d: 0 };
    answers.forEach(answer => {
      if (scores.hasOwnProperty(answer)) {
        scores[answer]++;
      }
    });
    
    // Determine skin type based on majority answers
    let skinType;
    const maxScore = Math.max(...Object.values(scores));
    const winners = Object.keys(scores).filter(key => scores[key] === maxScore);
    
    if (winners.length === 1) {
      switch (winners[0]) {
        case 'a': skinType = 'dry'; break;
        case 'b': skinType = 'normal'; break;
        case 'c': skinType = 'oily'; break;
        case 'd': skinType = 'combination'; break;
      }
    } else {
      // Handle ties
      if (winners.includes('a') && winners.includes('b')) skinType = 'dry';
      else if (winners.includes('a') && winners.includes('c')) skinType = 'oily';
      else if (winners.includes('a') && winners.includes('d')) skinType = 'combination';
      else if (winners.includes('b') && winners.includes('c')) skinType = 'combination';
      else if (winners.includes('b') && winners.includes('d')) skinType = 'combination';
      else if (winners.includes('c') && winners.includes('d')) skinType = 'combination';
      else skinType = 'normal'; // Default fallback
    }
    
    res.json({
      success: true,
      data: {
        skinType,
        scores,
        explanation: `Based on your answers, you have ${skinType} skin type.`
      }
    });
    
  } catch (error) {
    console.error('❌ Skin type determination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to determine skin type'
    });
  }
});

// Save User Profile (Requires Authentication)
router.post('/save-profile', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.user?.id; // Assuming auth middleware sets req.user
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to save profile'
      });
    }
    
    const { skinType, skinConcerns, knownSensitivities, preferredBrands } = req.body;
    
    const profile = await UserProfile.upsert({
      userId,
      skinType,
      skinConcerns: skinConcerns || [],
      knownSensitivities: knownSensitivities || [],
      preferredBrands: preferredBrands || []
    });
    
    res.json({
      success: true,
      message: 'Profile saved successfully',
      data: profile[0]
    });
    
  } catch (error) {
    console.error('❌ Profile save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save profile'
    });
  }
});

module.exports = router;