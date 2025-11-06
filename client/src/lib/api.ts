
// Helper function to get the auth token
export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

// Helper function to make authenticated API requests
export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<any> {
  const token = getAuthToken();

  if (!token) {
    localStorage.removeItem("token");
    window.location.href = "/";
    throw new Error("No authentication token found");
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
      throw new Error("Unauthorized");
    }
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  return response.json();
}
