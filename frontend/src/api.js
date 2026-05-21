// src/api.js — camada de comunicação com o backend

const BASE = "/api";

function getToken() {
  return localStorage.getItem("sbcustoms_token");
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.erro || `Erro ${res.status}`);
  }
  return data;
}

export const api = {
  get:    (path)        => request("GET",    path),
  post:   (path, body)  => request("POST",   path, body),
  put:    (path, body)  => request("PUT",    path, body),
  patch:  (path, body)  => request("PATCH",  path, body),
  delete: (path)        => request("DELETE", path),
};

// Auth
export const authApi = {
  login:  (email, senha)               => api.post("/auth/login", { email, senha }),
  me:     ()                           => api.get("/auth/me"),
  senha:  (senhaAtual, novaSenha)      => api.put("/auth/senha", { senhaAtual, novaSenha }),
};

// Recursos
export const clientesApi = {
  list:   (q = "")   => api.get(`/clientes?q=${encodeURIComponent(q)}`),
  get:    (id)       => api.get(`/clientes/${id}`),
  create: (body)     => api.post("/clientes", body),
  update: (id, body) => api.put(`/clientes/${id}`, body),
  delete: (id)       => api.delete(`/clientes/${id}`),
};

export const orcamentosApi = {
  list:     (q = "", status = "")    => api.get(`/orcamentos?q=${encodeURIComponent(q)}&status=${status}`),
  get:      (id)                     => api.get(`/orcamentos/${id}`),
  create:   (body)                   => api.post("/orcamentos", body),
  update:   (id, body)               => api.put(`/orcamentos/${id}`, body),
  status:   (id, status)             => api.patch(`/orcamentos/${id}/status`, { status }),
  gerarOS:  (id)                     => api.post(`/orcamentos/${id}/gerar-os`),
  delete:   (id)                     => api.delete(`/orcamentos/${id}`),
};

export const ordensApi = {
  list:   (q = "", status = "")    => api.get(`/ordens?q=${encodeURIComponent(q)}&status=${status}`),
  get:    (id)                     => api.get(`/ordens/${id}`),
  create: (body)                   => api.post("/ordens", body),
  update: (id, body)               => api.put(`/ordens/${id}`, body),
  status: (id, status)             => api.patch(`/ordens/${id}/status`, { status }),
  delete: (id)                     => api.delete(`/ordens/${id}`),
};

export const agendamentosApi = {
  list:   (q = "", data = "")    => api.get(`/agendamentos?q=${encodeURIComponent(q)}&data=${data}`),
  create: (body)                 => api.post("/agendamentos", body),
  update: (id, body)             => api.put(`/agendamentos/${id}`, body),
  status: (id, status)           => api.patch(`/agendamentos/${id}/status`, { status }),
  delete: (id)                   => api.delete(`/agendamentos/${id}`),
};

export const estoqueApi = {
  list:   (q = "", cat = "")  => api.get(`/estoque?q=${encodeURIComponent(q)}&categoria=${encodeURIComponent(cat)}`),
  critico: ()                 => api.get("/estoque/critico"),
  create: (body)              => api.post("/estoque", body),
  update: (id, body)          => api.put(`/estoque/${id}`, body),
  ajuste: (id, delta, obs)    => api.patch(`/estoque/${id}/ajuste`, { delta, obs }),
  delete: (id)                => api.delete(`/estoque/${id}`),
};

export const caixaApi = {
  list:   (data = "")   => api.get(`/caixa?data=${data}`),
  saldo:  ()            => api.get("/caixa/saldo"),
  create: (body)        => api.post("/caixa", body),
  delete: (id)          => api.delete(`/caixa/${id}`),
};

export const contasApi = {
  receber:       (status = "") => api.get(`/contas/receber?status=${status}`),
  pagar:         (status = "") => api.get(`/contas/pagar?status=${status}`),
  criarReceber:  (body)        => api.post("/contas/receber", body),
  criarPagar:    (body)        => api.post("/contas/pagar", body),
  editarReceber: (id, body)    => api.put(`/contas/receber/${id}`, body),
  editarPagar:   (id, body)    => api.put(`/contas/pagar/${id}`, body),
  baixarReceber: (id)          => api.patch(`/contas/receber/${id}/baixar`),
  baixarPagar:   (id)          => api.patch(`/contas/pagar/${id}/baixar`),
  delReceber:    (id)          => api.delete(`/contas/receber/${id}`),
  delPagar:      (id)          => api.delete(`/contas/pagar/${id}`),
};

export const usuariosApi = {
  list:   ()           => api.get("/usuarios"),
  create: (body)       => api.post("/usuarios", body),
  update: (id, body)   => api.put(`/usuarios/${id}`, body),
  toggle: (id)         => api.patch(`/usuarios/${id}/toggle`),
};