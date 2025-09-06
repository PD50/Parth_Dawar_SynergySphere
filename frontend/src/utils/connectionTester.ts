import axios from 'axios';

// Set base URL - same as in api.ts
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.motion-gpt.com' 
  : 'http://localhost:5000';

/**
 * Helper utility to test API connectivity
 * This is useful for debugging connectivity issues
 */
export const testApiConnection = async () => {
  console.log('[CONNECTION TEST] Testing API connection to:', API_URL);
  
  try {
    // Try to reach the health endpoint first
    const healthResponse = await axios.get(`${API_URL}/api/health`, {
      timeout: 5000, // 5 second timeout
    });
    
    console.log('[CONNECTION TEST] Health check response:', healthResponse.status, healthResponse.data);
    
    return {
      success: true,
      status: healthResponse.status,
      data: healthResponse.data,
      message: 'Connection successful'
    };
  } catch (error) {
    console.error('[CONNECTION TEST] Health check failed, trying a basic OPTIONS request');
    
    try {
      // If health endpoint doesn't exist, try a basic OPTIONS request
      const optionsResponse = await axios({
        method: 'OPTIONS',
        url: API_URL,
        timeout: 5000,
      });
      
      console.log('[CONNECTION TEST] OPTIONS response:', optionsResponse.status);
      
      return {
        success: true,
        status: optionsResponse.status,
        message: 'Server reachable but health check endpoint not available'
      };
    } catch (err) {
      console.error('[CONNECTION TEST] Connection failed completely:', err);
      
      // Extract useful error information
      let errorMessage = 'Unknown error';
      let errorDetails = {};
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused - server may not be running';
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Connection timed out - server may be slow or unreachable';
        } else if (err.response) {
          errorMessage = `Server responded with status ${err.response.status}`;
          errorDetails = {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          };
        } else if (err.request) {
          errorMessage = 'No response received from server';
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      return {
        success: false,
        message: errorMessage,
        error: errorDetails
      };
    }
  }
};

/**
 * Utility to check if authentication endpoints are working
 */
export const testAuthEndpoint = async () => {
  console.log('[AUTH TEST] Testing auth endpoint');
  
  try {
    const response = await axios.get(`${API_URL}/api/auth/status`, {
      timeout: 5000,
    });
    
    console.log('[AUTH TEST] Auth status response:', response.status, response.data);
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      message: 'Auth endpoint is working'
    };
  } catch (error) {
    console.error('[AUTH TEST] Auth endpoint test failed:', error);
    
    let errorMessage = 'Auth endpoint error';
    let errorDetails = {};
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `Server responded with status ${error.response.status}`;
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.request) {
        errorMessage = 'No response received from auth endpoint';
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: errorDetails
    };
  }
};

// Export an object that can be attached to window for debugging
export const connectionTester = {
  testConnection: testApiConnection,
  testAuth: testAuthEndpoint,
  getApiUrl: () => API_URL
};

// Add to window in development
if (process.env.NODE_ENV === 'development') {
  (window as any).__apiTester = connectionTester;
}

export default connectionTester;
