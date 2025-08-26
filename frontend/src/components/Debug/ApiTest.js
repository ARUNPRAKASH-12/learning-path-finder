import React, { useState } from 'react';
import api from '../../services/api';

const ApiTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, result, success = true) => {
    const newResult = {
      test,
      result: JSON.stringify(result, null, 2),
      success,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [newResult, ...prev]);
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await api.test();
      addResult('Connection Test', response.data, true);
    } catch (error) {
      addResult('Connection Test', { error: error.message, status: error.response?.status }, false);
    }
    setLoading(false);
  };

  const testRegistration = async () => {
    setLoading(true);
    const testUser = {
      name: 'Mobile Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpass123'
    };
    
    try {
      const response = await api.register(testUser);
      addResult('Registration Test', { status: response.status, data: response.data }, true);
    } catch (error) {
      addResult('Registration Test', { 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data 
      }, false);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    const credentials = {
      email: 'test@example.com',
      password: 'testpass123'
    };
    
    try {
      const response = await api.login(credentials);
      addResult('Login Test', { status: response.status, data: response.data }, true);
    } catch (error) {
      addResult('Login Test', { 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data 
      }, false);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test Page</h2>
      <p>Backend URL: {process.env.REACT_APP_API_URL || 'https://learning-path-finder-backend.onrender.com'}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testConnection} disabled={loading} style={{ margin: '5px', padding: '10px' }}>
          Test Connection
        </button>
        <button onClick={testRegistration} disabled={loading} style={{ margin: '5px', padding: '10px' }}>
          Test Registration
        </button>
        <button onClick={testLogin} disabled={loading} style={{ margin: '5px', padding: '10px' }}>
          Test Login
        </button>
        <button onClick={clearResults} style={{ margin: '5px', padding: '10px' }}>
          Clear Results
        </button>
      </div>

      {loading && <p>Testing...</p>}

      <div>
        {results.map((result, index) => (
          <div key={index} style={{ 
            border: '1px solid #ccc', 
            margin: '10px 0', 
            padding: '10px',
            backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8'
          }}>
            <h4>{result.test} - {result.success ? 'SUCCESS' : 'FAILED'}</h4>
            <p><strong>Time:</strong> {result.timestamp}</p>
            <pre style={{ overflow: 'auto', fontSize: '12px' }}>{result.result}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTest;
