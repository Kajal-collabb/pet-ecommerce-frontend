import axios from 'axios';

const BASE_URL = "http://10.20.0.131:8081/api";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
