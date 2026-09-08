import axios, { type AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enables HttpOnly cookie transmission
});

// Pub-sub mechanism for 401 Unauthorized handling without reading from storage
type UnauthorizedHandler = () => void;
const unauthorizedHandlers: Set<UnauthorizedHandler> = new Set();

export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

export function triggerUnauthorized() {
  unauthorizedHandlers.forEach((handler) => handler());
}

// Global response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      triggerUnauthorized();
    }
    return Promise.reject(error);
  }
);
