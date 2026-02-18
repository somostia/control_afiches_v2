import axios from 'axios';
import API_BASE_URL from '../config';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || API_BASE_URL,
    withCredentials: true,
    timeout: 10000,
});

// Response interceptor: bubble errors and optionally handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        // Allow components to handle errors; could add refresh token logic here later
        return Promise.reject(err);
    }
);

export default api;
