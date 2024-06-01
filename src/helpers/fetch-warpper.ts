import { useAuthStore } from '@/stores';

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method: string) {
    return async (url:string, body:any=null) => {
        const requestOptions:any = {
            method,
            headers: authHeader(url)
        }
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        // fetch is monkey patched in fake-backend in the beginning of main.ts
        return fetch(url, requestOptions).then(handleResponse);
    }
}

// helper functions
function authHeader(url:string) {
    // return auth header with jwt if user is logged in and request is to the api url
    const { user, token } = useAuthStore();
    const isLoggedIn = !!token;
    const isAPIUrl = url.startsWith(import.meta.env.VITE_API_URL);
    // const isApiUrl = true
    console.log("API_URL", url, user, isLoggedIn)
    if (isLoggedIn && isAPIUrl) {
        return { Authorization: `${token.token_type} ${token.access_token}` };
    } else {
        return {};
    }
}

async function handleResponse(response: any) {
    const isJson = response.headers?.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    // check for error response
    if (!response.ok) {
        const { user, logout } = useAuthStore();
        if ([401, 403].includes(response.status) && user) {
            // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
            logout();
        }
        // get error message from body or default to response status
        const error = (data && data.message) || response.status;
        return Promise.reject(error);
    }
    return data;
}
