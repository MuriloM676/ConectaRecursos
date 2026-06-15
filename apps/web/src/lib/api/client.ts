const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('accessToken', data.data.accessToken);
            return null; // Signal to retry
          }
        } catch {
          // Refresh failed
        }
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<{ success: boolean; data: T; timestamp: string }> {
    const { requireAuth = true, ...fetchOptions } = options;

    const headers = requireAuth
      ? await this.getAuthHeaders()
      : { 'Content-Type': 'application/json' };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    });

    const result = await this.handleResponse(response);

    // If refresh happened, retry once
    if (result === null) {
      const newHeaders = await this.getAuthHeaders();
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers: {
          ...newHeaders,
          ...fetchOptions.headers,
        },
      });
      return this.handleResponse(retryResponse);
    }

    return result;
  }

  async get<T = unknown>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
