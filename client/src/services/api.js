// src/services/api.js - Frontend API service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ API Response received');
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // IDD Helper API calls
  async generateLessonPlan(prompt, options = {}) {
    return this.request('/ai-completion', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        maxTokens: options.maxTokens || 2500,
        temperature: options.temperature || 0.7,
        userId: options.userId
      }),
    });
  }

  async getGenerationHistory(userId, limit = 10) {
    return this.request(`/ai-completion/history/${userId}?limit=${limit}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();