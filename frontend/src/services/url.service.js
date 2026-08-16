import axios from 'axios';

const apiurl = `${process.env.REACT_APP_BACKEND_API_URL}/api`;

const getToken = () => localStorage.getItem("auth_token")

const BaseUrl = axios.create({
    baseURL: apiurl,
    // withCredentials: true
});

BaseUrl.interceptors.request.use((config) => {
    const token = getToken();
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})

export default BaseUrl;