import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, AlertCircle, Brain, Sparkles, Zap, 
  ArrowLeft, ArrowRight, RotateCcw, Clock
} from 'lucide-react';

// Components
import SemanticQuizResults from '../components/Quiz/SemanticQuizResults';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// Services
import { quizAPI, apiUtils } from '../services/api';

// Hooks
import { useAuth } from '../hooks/useAuth';

const EnhancedSkinQuizPage = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Hooks
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Check for existing results in session storage
  useEffect(() => {
    const savedResults = sessionStorage.getItem('semanticQuizResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        setQuizResults(parsedResults);
        setQuizCompleted(true);
      } catch (error) {
        console.error('Error parsing saved quiz results:', error);
        sessionStorage.removeItem('semanticQuizResults');
      }
    }
  }, []);

  // Load quiz questions on component mount
  useEffect(() => {
    loadQuizQuestions();
    setStartTime(new Date());
  }, []);

  // Handle URL parameters (e.g., from previous quiz attempts)
  useEffect(() => {
    const retake = searchParams.get('retake');
    if (retake === 'true') {
      handleRetakeQuiz();
    }
  }, [searchParams]);

  const loadQuizQuestions = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading quiz questions...');
      
      const result = await quizAPI.getQuestions();
      
      if (result.success && result.data?.questions) {
        setQuestions(result.data.questions);
        setError(null);
      } else {
        throw new Error('Invalid questions format received');
      }
    } catch (error) {
      console.error('Failed to load quiz questions:', error);
      setError('Failed to load quiz questions. Please try again.');
      
      // Try fallback to basic questions
      try {
        const fallbackResult = await quizAPI.getBasicQuestions();
        if (fallbackResult.success && fallbackResult.data?.questions) {
          setQuestions(fallbackResult.data.questions);
          setError(null);
          toast.success('Loaded basic quiz questions');
        }
      } catch (fallbackError) {
        console.error('Fallback questions also failed:', fallbackError);
        toast.error('Unable to load quiz questions');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const isQuestionVisible = useCallback((question) => {
    if (!question.condition) return true;
    
    // Check condition against current responses
    for (const [conditionKey, conditionValue] of Object.entries(question.condition)) {
      if (responses[conditionKey] !== conditionValue) {
        return false;
      }
    }
    return true;
  }, [responses]);

  const getVisibleQuestions = useCallback(() => {
    return questions.filter(isQuestionVisible);
  }, [questions, isQuestionVisible]);

  const getCurrentQuestion = () => {
    const visibleQuestions = getVisibleQuestions();
    return visibleQuestions[currentStep] || null;
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => {
      const newResponses = { ...prev };
      
      // Handle exclusive options (like "none" in sensitivities)
      const currentQuestion = questions.find(q => q.id === questionId);
      if (currentQuestion?.type === 'multiple_choice') {
        const selectedOption = currentQuestion.options.find(opt => opt.value === value);
        
        if (selectedOption?.exclusive) {
          // Clear other selections if this is exclusive
          newResponses[questionId] = [value];
        } else {
          // Handle multiple selections
          const currentValues = newResponses[questionId] || [];
          if (currentValues.includes(value)) {
            // Remove if already selected
            newResponses[questionId] = currentValues.filter(v => v !== value);
          } else {
            // Add to selection, but remove exclusive options first
            const filteredValues = currentValues.filter(v => {
              const option = currentQuestion.options.find(opt => opt.value === v);
              return !option?.exclusive;
            });
            newResponses[questionId] = [...filteredValues, value];
          }
        }
      } else {
        // Single choice
        newResponses[questionId] = value;
      }
      
      return newResponses;
    });
  };

  const isCurrentStepValid = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return true;
    
    if (currentQuestion.required) {
      const response = responses[currentQuestion.id];
      return response && (Array.isArray(response) ? response.length > 0 : response.length > 0);
    }
    
    return true;
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      toast.error('Please answer the required question before continuing');
      return;
    }
    
    const visibleQuestions = getVisibleQuestions();
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleQuizSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const calculateProgress = () => {
    const visibleQuestions = getVisibleQuestions();
    if (visibleQuestions.length === 0) return 0;
    return Math.round(((currentStep + 1) / visibleQuestions.length) * 100);
  };

  const handleQuizSubmit = async () => {
    setIsLoading(true);
    
    // Dynamic loading messages for better UX
    const loadingMessages = [
      'Processing your responses...',
      'Analyzing your skin profile...',
      'Loading semantic reasoning engine...',
      'Matching ingredients to your needs...',
      'Generating personalized recommendations...',
      'Finalizing your results...'
    ];

    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++;
        setLoadingMessage(loadingMessages[messageIndex]);
      }
    }, 2500);

    try {
      console.log('🧬 Submitting enhanced quiz...');
      console.log('📝 Final responses:', responses);
      
      // Calculate completion time
      const completionTime = startTime ? (new Date() - startTime) / 1000 : 0;
      
      // Prepare submission data
      const submissionData = {
        responses,
        userId: user?.id || 'guest',
        saveProfile: !!user, // Only save if user is authenticated
        metadata: {
          completionTime,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      // Submit with semantic processing
      const result = await quizAPI.submitSemantic(submissionData);

      console.log('✅ Quiz results received:', result);

      if (result.success) {
        clearInterval(messageInterval);
        setQuizResults(result);
        setQuizCompleted(true);
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem('semanticQuizResults', JSON.stringify(result));
        
        // Show success message
        const method = result.semanticAnalysis?.method || 'Analysis';
        toast.success(
          `${method} completed successfully!`,
          {
            icon: result.metadata?.ontologyEnabled ? '🧠' : '✅',
            duration: 4000
          }
        );

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Track completion analytics
        trackQuizCompletion(result);
        
      } else {
        throw new Error(result.message || 'Quiz submission failed');
      }

    } catch (error) {
      clearInterval(messageInterval);
      console.error('❌ Quiz submission error:', error);
      
      const errorMessage = apiUtils.handleError(error, 'Failed to process quiz results');
      toast.error(errorMessage, { duration: 6000 });

      // Show specific guidance based on error type
      if (error.response?.status >= 500) {
        toast.error(
          'Server is experiencing issues. Please try again in a few minutes.',
          { duration: 8000 }
        );
      } else if (error.response?.status === 429) {
        toast.error(
          'Please wait a moment before submitting again.',
          { duration: 5000 }
        );
      }
      
      setError(errorMessage);
      
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const trackQuizCompletion = (result) => {
    // Analytics tracking (implement based on your analytics provider)
    if (window.gtag) {
      window.gtag('event', 'quiz_completed', {
        'method': result.semanticAnalysis?.method,
        'confidence': result.semanticAnalysis?.confidence,
        'user_type': result.metadata?.userType,
        'ontology_enabled': result.metadata?.ontologyEnabled
      });
    }
  };

  const handleViewAllProducts = () => {
    // Navigate to products page with context from quiz results
    const profileParams = new URLSearchParams();
    
    if (quizResults?.profile?.skinType) {
      profileParams.set('skinType', quizResults.profile.skinType);
    }
    if (quizResults?.profile?.skinConcerns?.length > 0) {
      profileParams.set('concerns', quizResults.profile.skinConcerns.join(','));
    }
    if (quizResults?.semanticAnalysis?.recommendedIngredients?.length > 0) {
      const topIngredients = quizResults.semanticAnalysis.recommendedIngredients
        .slice(0, 3)
        .map(ing => ing.ingredient || ing.label);
      profileParams.set('ingredients', topIngredients.join(','));
    }
    
    navigate(`/products?${profileParams.toString()}`);
  };

  const handleRetakeQuiz = () => {
    setQuizCompleted(false);
    setQuizResults(null);
    setCurrentStep(0);
    setResponses({});
    setError(null);
    setStartTime(new Date());
    sessionStorage.removeItem('semanticQuizResults');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Remove retake parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('retake');
    navigate({ search: newSearchParams.toString() }, { replace: true });
  };

  // Loading state
  if (isLoading && !quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto relative">
              <Brain className="w-24 h-24 text-blue-600 animate-pulse" />
              <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 w-20 h-20 border-2 border-purple-600 border-b-transparent rounded-full animate-spin animate-reverse"></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            {loadingMessage || 'Processing Your Skin Analysis'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our AI is analyzing your responses using advanced semantic reasoning...
          </p>
          
          {/* Progress indicator */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 mr-1" />
              Semantic Analysis
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              AI Matching
            </div>
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-1" />
              Ontology Reasoning
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {quizCompleted ? 'Your Skincare Analysis Results' : 'AI-Powered Skin Analysis Quiz'} - MatchCare
        </title>
        <meta name="description" content="Take our comprehensive skin analysis quiz powered by semantic reasoning to get personalized skincare product recommendations based on advanced AI." />
        <meta name="keywords" content="skin quiz, skincare analysis, personalized recommendations, semantic AI, ontology-based matching" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {!quizCompleted ? (
            <>
              {/* Quiz Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  AI-Powered Skin Analysis
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                  Get personalized skincare recommendations powered by advanced semantic reasoning and ontology-based analysis.
                </p>
                
                {/* Progress bar */}
                <div className="w-full max-w-md mx-auto mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{calculateProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Semantic Analysis
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Brain className="w-4 h-4 mr-1" />
                    AI Reasoning
                  </div>
                  <div className="flex items-center text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Ingredient Matching
                  </div>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-200">Error Loading Quiz</h3>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                      <button 
                        onClick={loadQuizQuestions}
                        className="mt-2 text-sm text-red-800 dark:text-red-200 underline hover:no-underline"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Question */}
              {questions.length > 0 && !error && (
                <QuizQuestion 
                  question={getCurrentQuestion()}
                  responses={responses}
                  onResponseChange={handleResponseChange}
                  currentStep={currentStep}
                  totalSteps={getVisibleQuestions().length}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  isValid={isCurrentStepValid()}
                />
              )}
            </>
          ) : (
            <>
              {/* Results Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-full">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Personalized Results
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Based on advanced semantic analysis, here are your intelligent skincare recommendations
                </p>
                
                {/* Results metadata */}
                {quizResults?.metadata && (
                  <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                    {quizResults.metadata.ontologyEnabled && (
                      <div className="flex items-center text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                        <Brain className="w-4 h-4 mr-1" />
                        Semantic Web Reasoning
                      </div>
                    )}
                    <div className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {quizResults.recommendations?.length || 0} Personalized Matches
                    </div>
                    {quizResults.semanticAnalysis?.confidence && (
                      <div className="flex items-center text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {quizResults.semanticAnalysis.confidence}% Analysis Confidence
                      </div>
                    )}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 mr-1" />
                      Completed {new Date().toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Quiz Results Component */}
              <SemanticQuizResults 
                results={quizResults}
                onViewAllProducts={handleViewAllProducts}
                onRetakeQuiz={handleRetakeQuiz}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Quiz Question Component
const QuizQuestion = ({ 
  question, 
  responses, 
  onResponseChange, 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  isValid 
}) => {
  if (!question) return null;

  const currentResponse = responses[question.id];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
      
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Question {currentStep + 1} of {totalSteps}
          </span>
          {question.required && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              Required
            </span>
          )}
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {question.title}
        </h2>
        
        {question.description && (
          <p className="text-gray-600 dark:text-gray-400">
            {question.description}
          </p>
        )}
      </div>

      {/* Question Options */}
      <div className="mb-8">
        {question.type === 'single_choice' && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label 
                key={option.value}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentResponse === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={currentResponse === option.value}
                    onChange={(e) => onResponseChange(question.id, e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {option.icon && <span className="text-lg">{option.icon}</span>}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    )}
                    {option.timeCommitment && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Time: {option.timeCommitment}
                      </p>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
            {question.maxSelections && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select up to {question.maxSelections} options
              </p>
            )}
            {question.options.map((option, index) => {
              const isSelected = Array.isArray(currentResponse) && currentResponse.includes(option.value);
              const isDisabled = question.maxSelections && 
                Array.isArray(currentResponse) && 
                currentResponse.length >= question.maxSelections && 
                !isSelected;

              return (
                <label 
                  key={option.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isDisabled
                      ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name={question.id}
                      value={option.value}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => onResponseChange(question.id, e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                        {option.severity && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            option.severity === 'high' ? 'bg-red-100 text-red-700' :
                            option.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {option.severity}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={currentStep === 0}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{currentStep + 1}</span>
          <span>/</span>
          <span>{totalSteps}</span>
        </div>

        <button
          onClick={onNext}
          disabled={!isValid}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            !isValid
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <span>{currentStep === totalSteps - 1 ? 'Complete Analysis' : 'Next'}</span>
          {currentStep === totalSteps - 1 ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default EnhancedSkinQuizPage;