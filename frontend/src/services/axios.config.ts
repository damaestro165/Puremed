import axios from 'axios';
import authService from './auth.service';

// Add a request interceptor
axios.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized error (e.g., token expired)
            authService.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
); 