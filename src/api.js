// Cliente da API do Lift. Em dev, o Vite faz proxy de /api -> localhost:3333.
const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

async function req(path, options) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Erro ${res.status} em ${path}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  dashboard: () => req("/dashboard"),

  plans: () => req("/plans"),
  plan: (id) => req(`/plans/${id}`),

  diet: (date) => req(`/diet?date=${date}`),
  addDiet: (body) => req("/diet", { method: "POST", body: JSON.stringify(body) }),
  delDiet: (id) => req(`/diet/${id}`, { method: "DELETE" }),

  weight: () => req("/weight"),
  addWeight: (body) => req("/weight", { method: "POST", body: JSON.stringify(body) }),

  sessions: () => req("/sessions"),
  session: (id) => req(`/sessions/${id}`),
  addSession: (body) => req("/sessions", { method: "POST", body: JSON.stringify(body) }),
  delSession: (id) => req(`/sessions/${id}`, { method: "DELETE" }),

  upload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(BASE + "/uploads", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Falha no upload");
    return res.json();
  },
};
