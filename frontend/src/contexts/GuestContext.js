import React, { createContext, useContext, useReducer, useEffect } from 'react';

const GuestContext = createContext();

const initialState = {
  sessionId: null,
  profile: null,
  preferences: {
    avoidedIngredients: [],
    preferredIngredients: [],
    skinType: null,
    skinConcerns: [],
    sensitivities: []
  },
  isActive: false,
  viewedProducts: []
};

function guestReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        isActive: true
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.payload }
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    case 'ADD_VIEWED_PRODUCT':
      return {
        ...state,
        viewedProducts: [...state.viewedProducts, action.payload].slice(-50)
      };
    case 'CLEAR_SESSION':
      return initialState;
    default:
      return state;
  }
}

export function GuestProvider({ children }) {
  const [state, dispatch] = useReducer(guestReducer, initialState);

  useEffect(() => {
    // Initialize guest session
    const existingSessionId = localStorage.getItem('guest_session_id');
    if (existingSessionId) {
      dispatch({
        type: 'SET_SESSION',
        payload: { sessionId: existingSessionId }
      });
    } else {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem('guest_session_id', newSessionId);
      dispatch({
        type: 'SET_SESSION',
        payload: { sessionId: newSessionId }
      });
    }
  }, []);

  const updateProfile = (profileData) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: profileData });
  };

  const updatePreferences = (preferences) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const addViewedProduct = (productId) => {
    if (!state.viewedProducts.includes(productId)) {
      dispatch({ type: 'ADD_VIEWED_PRODUCT', payload: productId });
    }
  };

  const clearSession = () => {
    localStorage.removeItem('guest_session_id');
    dispatch({ type: 'CLEAR_SESSION' });
  };

  return (
    <GuestContext.Provider
      value={{
        ...state,
        updateProfile,
        updatePreferences,
        addViewedProduct,
        clearSession
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
};