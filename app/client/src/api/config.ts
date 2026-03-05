import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import { loadSession } from "@/utils/storage";

// Create an Axios instance with default configuration. This instance is used to request protected endpoints only.
const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Include cookies for authentication
});
const session = loadSession();
const accessToken = session ? `Bearer ${session.token}` : "";
instance.defaults.headers.common["Authorization"] = accessToken;

//updates the token on each user request in case it has changed
instance.interceptors.request.use(
    (config) => {
        const session = loadSession();
        if (session?.token) {
            config.headers.Authorization = `Bearer ${session.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export { instance };