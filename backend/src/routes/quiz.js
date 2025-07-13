import React, { useState } from 'react';
import { 
  Brain, Sparkles, AlertTriangle, CheckCircle, Info, 
  User, Target, Shield, TrendingUp, ArrowRight, Eye,
  ChevronDown, ChevronUp, Star, Zap, Heart
} from 'lucide-react';
import ProductCard from '../Products/ProductCard';

const SemanticQuizResults = ({ results, onViewAllProducts, onRetakeQuiz }) => {
  const [expandedSection, setExpandedSection] = useState('profile');
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  
  if (!results) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No analysis results available</p>
        <button 
          onClick={onRetakeQuiz}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Take Quiz
        </button>
      </div>
    );
  }

  const { 
    profile, 
    recommendations, 
    semanticAnalysis, 
    insights, 
    metadata,
    nextSteps 
  } = results;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-700 bg-green-100 border-green-200';
    if (confidence >= 70) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (confidence >= 55) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header with Analysis Method */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI-Powered Skin Analysis Complete
              </h2>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                {metadata?.ontologyEnabled 
                  ? 'Advanced semantic reasoning with skincare ontology'
                  : 'Comprehensive rule-based analysis with ingredient interaction detection'
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getConfidenceColor(semanticAnalysis?.confidence || 70)}`}>
              <Sparkles className="w-4 h-4 mr-2" />
              {semanticAnalysis?.confidence || 70}% Confidence
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {metadata?.userType === 'guest' ? 'Guest Analysis' : 'Personalized Analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Analysis Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('profile')}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Skin Profile Analysis
            </h2>
          </div>
          {expandedSection === 'profile' ? 
            <ChevronUp className="w-5 h-5 text-gray-500" /> : 
            <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </button>
        
        {expandedSection === 'profile' && (
          <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              
              {/* Skin Type */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Skin Type</h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getSkinTypeEmoji(profile?.skinType)}</span>
                    <span className="text-lg font-medium text-blue-700 dark:text-blue-300 capitalize">
                      {profile?.skinType}
                    </span>
                  </div>
                  {insights?.skinTypeReasoning && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {insights.skinTypeReasoning}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Main Concerns */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Main Concerns</h3>
                <div className="space-y-2">
                  {profile?.skinConcerns?.slice(0, 4).map((concern, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {concern.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {profile?.skinConcerns?.length > 4 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{profile.skinConcerns.length - 4} more concerns
                    </div>
                  )}
                </div>
              </div>
              
              {/* Analysis Quality */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Analysis Quality</h3>
                <div className="space-y-3">
                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile?.confidence || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${profile?.confidence || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Completeness */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Completeness</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile?.completeness || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${profile?.completeness || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            {insights?.safetyTips && insights.safetyTips.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Personalized Safety Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {insights.safetyTips.slice(0, 4).map((tip, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800 dark:text-green-200">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Semantic Ingredients Analysis */}
      {semanticAnalysis && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('ingredients')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Smart Ingredient Recommendations
              </h2>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                {semanticAnalysis.recommendedIngredients?.length || 0} found
              </span>
            </div>
            {expandedSection === 'ingredients' ? 
              <ChevronUp className="w-5 h-5 text-gray-500" /> : 
              <ChevronDown className="w-5 h-5 text-gray-500" />
            }
          </button>
          
          {expandedSection === 'ingredients' && (
            <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                
                {/* Recommended Ingredients */}
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Top Recommended Ingredients
                  </h3>
                  <div className="space-y-3">
                    {semanticAnalysis.recommendedIngredients?.slice(0, 6).map((ingredient, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedIngredient === index 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedIngredient(selectedIngredient === index ? null : index)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-2" />
                            {ingredient.ingredient || ingredient.label}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-semibold ${getScoreColor(ingredient.score)}`}>
                              {ingredient.score}/100
                            </span>
                            {ingredient.efficacyScore && ingredient.efficacyScore > 85 && (
                              <Zap className="w-4 h-4 text-orange-500" title="High Efficacy" />
                            )}
                          </div>
                        </div>
                        
                        {ingredient.reasons && ingredient.reasons.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {ingredient.reasons.slice(0, 2).join(', ')}
                          </p>
                        )}
                        
                        {selectedIngredient === index && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                            {ingredient.functions && ingredient.functions.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Functions:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {ingredient.functions.map((func, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {func}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {ingredient.treatsConcerns && ingredient.treatsConcerns.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Treats:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {ingredient.treatsConcerns.map((concern, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                      {concern}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {ingredient.efficacyScore && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Efficacy: {ingredient.efficacyScore}/100 | Safety: {ingredient.safetyRating || 'N/A'}/10
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ingredient Interactions */}
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Ingredient Insights
                  </h3>
                  
                  {/* Synergistic Combinations */}
                  {semanticAnalysis.interactions?.synergistic?.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Beneficial Combinations
                        </span>
                      </div>
                      <div className="space-y-2">
                        {semanticAnalysis.interactions.synergistic.slice(0, 3).map((combo, index) => (
                          <div key={index} className="text-sm text-green-700 dark:text-green-300 flex items-center">
                            <Heart className="w-4 h-4 mr-2 text-green-500" />
                            {combo.ingredients ? combo.ingredients.join(' + ') : `${combo[0]} + ${combo[1]}`}
                            {combo.reason && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                ({combo.reason})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Incompatible Combinations */}
                  {semanticAnalysis.interactions?.incompatible?.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-orange-800 dark:text-orange-200">
                          Avoid Together
                        </span>
                      </div>
                      <div className="space-y-2">
                        {semanticAnalysis.interactions.incompatible.slice(0, 3).map((conflict, index) => (
                          <div key={index} className="text-sm text-orange-700 dark:text-orange-300">
                            <div className="flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                              {conflict.ingredients ? conflict.ingredients.join(' ⚠️ ') : `${conflict[0]} ⚠️ ${conflict[1]}`}
                            </div>
                            {conflict.reason && (
                              <p className="ml-6 text-xs text-orange-600 dark:text-orange-400 mt-1">
                                {conflict.reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analysis Summary */}
                  {semanticAnalysis.reasoning && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-2">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Analysis Summary
                          </h4>
                          <div className="space-y-1">
                            {semanticAnalysis.reasoning.slice(0, 4).map((reason, index) => (
                              <p key={index} className="text-sm text-blue-700 dark:text-blue-300">
                                • {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recommended Products
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              {recommendations?.length || 0} matches
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {metadata?.userType === 'guest' ? 'Sample recommendations' : 'Personalized for you'}
          </div>
        </div>

        <div className="p-6">
          {recommendations && recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {recommendations.slice(0, 6).map((item, index) => (
                  <div key={index} className="relative group">
                    <ProductCard 
                      product={item.product} 
                      showMatchScore={true}
                      matchScore={item.matchScore}
                      explanation={item.explanation}
                      className="h-full"
                    />
                    
                    {/* Semantic Insights Overlay */}
                    {item.semanticInsights && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs space-y-1">
                        {item.semanticInsights.ontologyMatches?.length > 0 && (
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <Brain className="w-3 h-3 mr-1" />
                            {item.semanticInsights.ontologyMatches.length} semantic matches
                          </div>
                        )}
                        {item.semanticInsights.interactions?.synergistic > 0 && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {item.semanticInsights.interactions.synergistic} beneficial synergies
                          </div>
                        )}
                        {item.semanticInsights.interactions?.incompatible > 0 && (
                          <div className="flex items-center text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {item.semanticInsights.interactions.incompatible} potential conflicts
                          </div>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Show More Products Button */}
              {recommendations.length > 6 && (
                <div className="text-center mb-6">
                  <button 
                    onClick={() => {/* Handle show more */}}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Show {recommendations.length - 6} More Products
                  </button>
                </div>
              )}

              {/* Upgrade Notice for Guests */}
              {metadata?.userType === 'guest' && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start space-x-4">
                    <TrendingUp className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        Unlock Full Personalization
                      </h3>
                      <p className="text-purple-700 dark:text-purple-300 mb-4">
                        Create an account to get detailed semantic analysis, save your favorites, track your routine, and receive ongoing personalized recommendations.
                      </p>
                      <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                          Create Account
                        </button>
                        <button className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm">
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No recommendations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We couldn't find products matching your specific profile. Try adjusting your preferences or retaking the quiz.
              </p>
              <button
                onClick={onRetakeQuiz}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retake Quiz
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {recommendations && recommendations.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={onViewAllProducts}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
              >
                <Eye className="w-5 h-5 mr-2" />
                View All Products
              </button>
              <button
                onClick={onRetakeQuiz}
                className="px-8 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2" />
            Recommended Next Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nextSteps.slice(0, 6).map((step, index) => (
              <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    step.priority === 'high' ? 'bg-red-500' : 
                    step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {step.action}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Metadata */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
        Analysis completed using {semanticAnalysis?.method || 'Advanced Analysis'} • 
        Processing time: {metadata?.processingTime ? `${metadata.processingTime}ms` : 'N/A'} • 
        MatchCare {metadata?.version || 'v1.0'}
        {metadata?.ontologyEnabled && (
          <span className="ml-2 inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
            <Brain className="w-3 h-3 mr-1" />
            Semantic Web Powered
          </span>
        )}
      </div>
    </div>
  );
};

// Helper function for skin type emojis
const getSkinTypeEmoji = (skinType) => {
  const emojiMap = {
    'normal': '😊',
    'dry': '🏜️',
    'oily': '✨',
    'combination': '🎭',
    'sensitive': '🌹'
  };
  return emojiMap[skinType] || '😊';
};

export default SemanticQuizResults;