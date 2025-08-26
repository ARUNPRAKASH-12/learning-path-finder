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
    loading: true
  });

  useEffect(() => {
    // Check for existing authentication from localStorage
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          console.log('Restoring user session:', user);
          
          // Set the token for API requests
          setAuthToken(token);
          
          // Verify token is still valid by making a test API call
          try {
            // Use getUserAnalytics as it always returns data even for new users
            const response = await api.getUserAnalytics();
            console.log('Token validation successful');
            
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user,
                token
              }
            });
          } catch (error) {
            console.log('Token expired or invalid, clearing stored data');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            clearAuthToken();
          }
        } else {
          console.log('No stored authentication found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        clearAuthToken();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Attempting login with:', { email });
      
      const res = await api.login({ email, password });
      
      console.log('Login response:', res.data);

      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        
        // Ensure user has both id and _id for compatibility
        const user = {
          ...userData,
          id: userData._id || userData.id, // Use _id as id for compatibility
          _id: userData._id || userData.id
        };
        
        console.log('Processed user data:', user);
        
        // Store token and user data in localStorage for persistence
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
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
          message: res.data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('Attempting registration with:', { name, email });
      
      const res = await api.register({ name, email, password });
      
      console.log('Registration response:', res.data);

      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        
        // Ensure user has both id and _id for compatibility
        const user = {
          ...userData,
          id: userData._id || userData.id, // Use _id as id for compatibility
          _id: userData._id || userData.id
        };
        
        console.log('Processed registration user data:', user);
        
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            token
          }
        });
        
        return { success: true };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return {
          success: false,
          message: res.data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    console.log('Logging out user:', state.user?.id);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Clear API token
    clearAuthToken();
    
    // Clear context state
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    console.log('Updating user in context:', userData);
    
    // Update context state
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
    
    // Update localStorage with new user data
    const updatedUser = {
      ...state.user,
      ...userData
    };
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    console.log('User data updated in localStorage:', updatedUser);
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
