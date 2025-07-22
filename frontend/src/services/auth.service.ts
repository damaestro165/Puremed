import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name?: string;
        picture?: string;
    };
    message: string;
}

export interface AuthError {
    message: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

class AuthService {
    private handleAuthError(error: AxiosError): never {
        if (error.response?.data) {
            throw error.response.data as AuthError;
        }
        throw { message: 'Network error occurred' } as AuthError;
    }

    private storeAuthData(token: string, user: AuthResponse['user']): void {
        try {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Failed to store auth data:', error);
            throw { message: 'Failed to store authentication data' } as AuthError;
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await axios.post(`${API_URL}/register`, data);
            
            if (response.data.token && response.data.user) {
                this.storeAuthData(response.data.token, response.data.user);
            }
            
            return response.data;
        } catch (error) {
            this.handleAuthError(error as AxiosError);
        }
    }

    async login(data: LoginData): Promise<AuthResponse> {
        try {
            const response = await axios.post(`${API_URL}/login`, data);
            
            if (response.data.token && response.data.user) {
                this.storeAuthData(response.data.token, response.data.user);
            }
            
            return response.data;
        } catch (error) {
            this.handleAuthError(error as AxiosError);
        }
    }

    logout(): void {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Failed to clear auth data:', error);
        }
    }

    getCurrentUser(): AuthResponse['user'] | null {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                return JSON.parse(userStr);
            }
            return null;
        } catch (error) {
            console.error('Failed to parse user data:', error);
            // Clear corrupted data
            localStorage.removeItem('user');
            return null;
        }
    }

    getToken(): string | null {
        try {
            return localStorage.getItem('token');
        } catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        
        // Basic token validation - check if it's not expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (error) {
            // If token is malformed, remove it
            this.logout();
            return false;
        }
    }

    initiateGoogleLogin(): void {
        window.location.href = `${API_URL}/google`;
    }

    async handleGoogleCallback(token: string): Promise<void> {
        try {
            if (!token) {
                throw { message: 'No token provided' } as AuthError;
            }
    
            console.log('Storing token:', token); // Debug log
            localStorage.setItem('token', token);
            
            // Fetch user data with the token
            console.log('Fetching user data...'); // Debug log
            const response = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('User response:', response.data); // Debug log
            
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            console.error('Auth service error:', error); // Debug log
            
            // More specific error handling
            if (error.response) {
                console.error('Response error:', error.response.data);
                throw new Error(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
            } else if (error.request) {
                console.error('Request error:', error.request);
                throw new Error('Network error - please check your connection');
            } else {
                console.error('Setup error:', error.message);
                throw new Error(error.message || 'Unknown error occurred');
            }
        }
    }

    // Add method to get auth headers for API calls
    getAuthHeaders(): Record<string, string> {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Add method to refresh user data
    async refreshUserData(): Promise<void> {
        try {
            const token = this.getToken();
            if (!token) {
                throw { message: 'No token available' } as AuthError;
            }

            const response = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            this.handleAuthError(error as AxiosError);
        }
    }
}

export default new AuthService();