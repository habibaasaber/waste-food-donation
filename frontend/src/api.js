import axios from 'axios';

const api = axios.create({
    baseURL: 'https://waste-food-donation-production.up.railway.app/api',
});

// Intercept requests to add JWT token if exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
