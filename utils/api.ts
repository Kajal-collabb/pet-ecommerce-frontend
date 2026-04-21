import axios from 'axios';

const BASE_URL = "http://192.168.0.77:8081/api";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
