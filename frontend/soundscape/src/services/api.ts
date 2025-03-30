// Maximum time in milliseconds to wait for a response before timing out
const REQUEST_TIMEOUT = 30000;

// Maximum number of retry attempts for failed requests
const MAX_RETRIES = 3;

// Base API URL - would typically come from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pknqxnta3a.execute-api.us-east-1.amazonaws.com/prod/api';
console.log('API_BASE_URL:', API_BASE_URL);

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Retry logic with exponential backoff
const retryFetch = async (url: string, options: RequestInit, retries = 0): Promise<Response> => {
  try {
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // If the response is not ok and we have retries left, try again
    if (!response.ok) {
      if (retries < MAX_RETRIES) {
        // Exponential backoff with jitter
        const delay = Math.min(1000 * 2 ** retries, 10000) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryFetch(url, options, retries + 1);
      }
      
      // If we've exhausted our retries, throw an error
      const errorText = await response.text();
      throw new ApiError(
        `API request failed: ${errorText || response.statusText}`, 
        response.status
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    
    if (retries < MAX_RETRIES && !(error instanceof ApiError)) {
      // Exponential backoff with jitter for network errors
      const delay = Math.min(1000 * 2 ** retries, 10000) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryFetch(url, options, retries + 1);
    }
    
    throw error;
  }
};

// Helper function to build API URLs
const buildUrl = (endpoint: string): string => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  console.log('Built URL:', url);
  console.log('Environment variable:', import.meta.env.VITE_API_BASE_URL);
  return url;
};

// Type for upload progress callback
type ProgressCallback = (percent: number) => void;

/**
 * API methods for the Soundscape application
 */
export const api = {
  /**
   * Check if the API is healthy
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await retryFetch(buildUrl('/health'), {
      method: 'GET',
    });
    
    return response.json();
  },
  
  /**
   * Analyze an image and generate a soundscape
   * @param imageFile The image file to analyze
   * @param onProgress Optional callback for upload progress
   */
  async analyzeImage(
    imageFile: File, 
    onProgress?: ProgressCallback
  ): Promise<{
    imageId: string;
    description: string;
    scene: string;
    audioUrl: string;
    detectedElements: string[];
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert the image to base64
        const base64Image = await this.fileToBase64(imageFile);
        
        // Simulate progress for now
        if (onProgress) {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 5;
            if (progress <= 90) {
              onProgress(progress);
            } else {
              clearInterval(interval);
            }
          }, 300);
        }
        
        // Make the API request
        const response = await retryFetch(buildUrl('/analyze'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image
          })
        });
        
        // Complete the progress at 100%
        if (onProgress) {
          onProgress(100);
        }
        
        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * Convert a file to base64
   * @param file The file to convert
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/xxx;base64, prefix
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  },
};