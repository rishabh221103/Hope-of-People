export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string>;
}

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('hop_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || 'Request failed';
    const error: ApiError = {
      message: errorMsg,
      statusCode: response.status,
      errors: data?.data || undefined,
    };
    throw error;
  }

  return (data?.data !== undefined ? data.data : data) as T;
}
