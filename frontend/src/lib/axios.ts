import axios from "axios";
import type { ApiError } from "../types/api.types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      message: "Something went wrong. Please try again.",
      status: error.response?.status,
    };

    if (error.response?.data?.error) {
      apiError.message = error.response.data.error;
    } else if (error.response?.data?.message) {
      apiError.message = error.response.data.message;
    } else if (error.code === "ERR_NETWORK") {
      apiError.message =
        "Unable to reach the server. Please check your connection.";
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(apiError);
  },
);
