const isServer = typeof window === "undefined";
const API_URL = isServer
  ? process.env.INTERNAL_API_URL || "http://api:3001"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export const api = {
  events: {
    list: () => request("/events"),
    get: (id: string) => request(`/events/${id}`),
  },
  bookings: {
    create: (data: { eventId: string; userEmail: string; quantity: number }) =>
      request("/bookings", { method: "POST", body: JSON.stringify(data) }),
    confirm: (id: string) => request(`/bookings/${id}/confirm`, { method: "PATCH" }),
    get: (id: string) => request(`/bookings/${id}`),
    listByEmail: (email: string) => request(`/bookings?email=${email}`),
  },
  analytics: {
    getEvent: (id: string) => request(`/analytics/events/${id}`),
    getSummary: () => request("/analytics/summary"),
  },
  seed: () => request("/seed", { method: "POST" }),
};
