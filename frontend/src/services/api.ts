import { 
  SearchRequest, 
  ContextSearchRequest,
  BasicSearchResponse, 
  ProbabilitySearchResponse,
  DeepSearchResponse, 
  APIResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class APIError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'APIError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new APIError(response.status, 'Invalid response format');
  }

  const data: APIResponse<T> = await response.json();

  if (!response.ok) {
    throw new APIError(
      response.status,
      data.error?.message || `HTTP ${response.status}`,
      data.error
    );
  }

  if (!data.success) {
    throw new APIError(
      data.error?.status || 500,
      data.error?.message || 'API request failed',
      data.error
    );
  }

  return data.data!;
};

export const searchAPI = {
  basic: async (request: SearchRequest): Promise<BasicSearchResponse> => {
    const response = await fetch(`${API_BASE_URL}/search/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId(),
      },
      body: JSON.stringify(request),
    });

    return handleResponse<BasicSearchResponse>(response);
  },

  deep: async (request: SearchRequest): Promise<DeepSearchResponse> => {
    const response = await fetch(`${API_BASE_URL}/search/deep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId(),
      },
      body: JSON.stringify(request),
    });

    return handleResponse<DeepSearchResponse>(response);
  },

  context: async (request: ContextSearchRequest): Promise<ProbabilitySearchResponse> => {
    const response = await fetch(`${API_BASE_URL}/search/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId(),
      },
      body: JSON.stringify(request),
    });

    return handleResponse<ProbabilitySearchResponse>(response);
  },

  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/search/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  }
};

export const patternsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/patterns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },

  getByLanguage: async (language: string) => {
    const response = await fetch(`${API_BASE_URL}/patterns/${language}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  }
};

export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  }
};

const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export { APIError };