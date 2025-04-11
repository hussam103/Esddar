import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void
): Promise<Response> {
  // Check if data is FormData to handle file uploads
  const isFormData = data instanceof FormData;
  
  const options: RequestInit = {
    method,
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  };
  
  // For file uploads with progress tracking, use XMLHttpRequest instead of fetch
  if (isFormData && onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.withCredentials = true;
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onUploadProgress) {
          onUploadProgress({
            loaded: event.loaded,
            total: event.total
          });
        }
      });
      
      xhr.onload = () => {
        const response = new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers({
            'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json'
          })
        });
        
        if (response.ok) {
          resolve(response);
        } else {
          response.text().then(text => {
            reject(new Error(`${response.status}: ${text || response.statusText}`));
          });
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error'));
      };
      
      xhr.send(data as FormData);
    });
  } else {
    // Regular fetch for non-FormData requests
    const res = await fetch(url, options);
    await throwIfResNotOk(res);
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
