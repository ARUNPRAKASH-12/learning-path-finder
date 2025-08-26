import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api, { setAuthToken, clearAuthToken } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  });

  // No localStorage initialization - start fresh each time
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Attempting login with:', { email });
      
      const res = await api.login({ email, password });
      
      console.log('Login response:', res);

      if (res.data && res.data.success) {
        const { token, ...userData } = res.data.data;
        
        const user = {
          ...userData,
          id: userData._id || userData.id,
          _id: userData._id || userData.id
        };
        
        console.log('Login successful, user data:', user);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            token
          }
        });
        
        // Set the token for API requests
        setAuthToken(token);
        
        return { success: true };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return {
          success: false,
          message: res.data?.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Attempting registration with:', { name, email });
      
      const res = await api.register({ name, email, password });
      
      console.log('Registration response:', res);

      if (res.data && res.data.success) {
        const { token, ...userData } = res.data.data;
        
        const user = {
          ...userData,
          id: userData._id || userData.id,
          _id: userData._id || userData.id
        };
        
        console.log('Registration successful, user data:', user);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            token
          }
        });
        
        // Set the token for API requests
        setAuthToken(token);
        
        return { success: true };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return {
          success: false,
          message: res.data?.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Clear API token
    clearAuthToken();
    
    // Clear context state
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    console.log('Updating user in context:', userData);
    
    // Update context state only
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
