// Helper function to get auth token
export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Helper function to make authenticated API requests
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/auth";
    throw new Error("No authentication token found");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth";
      throw new Error("Unauthorized");
    }
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  return response.json();
}