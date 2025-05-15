// This is a placeholder for your actual API service configuration.
// You might be using Axios, Fetch, or another library.

// Example using Axios:
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v2'; // Adjust to your backend API base URL

const apiService = axios.create({
    baseURL: baseURL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor to add the auth token to requests
apiService.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// You might want to add response interceptors for global error handling, e.g., 401, 403 errors
apiService.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access, e.g., redirect to login
            // localStorage.removeItem('authToken');
            // window.location.href = '/login'; 
            console.error("Unauthorized access - 401. Redirecting to login might be needed.");
        } else if (error.response && error.response.status === 403) {
            // Handle forbidden access
            console.error("Forbidden access - 403.");
            // Potentially redirect to an unauthorized page or show a notification
        }
        return Promise.reject(error);
    }
);

export default apiService;

