// tests/helpers.js – utilitários compartilhados pelos testes do caso de uso "Criar Serviço"
require("dotenv").config();
const request = require("supertest");
const jwt = require("jsonwebtoken");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
// Cliente que existe em `clientes` E cujo id também existe em `usuarios` (por causa do FK do SQL atual)
const CLIENTE_ID = Number(process.env.CLIENTE_ID || 1);

const api = () => request(BASE_URL);

let tokenAdminCache;
async function tokenAdmin() {
  if (tokenAdminCache) return tokenAdminCache;
  const res = await api()
    .post("/auth/login")
    .send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
  if (res.status !== 200) throw new Error("Falha no login do admin: HTTP " + res.status);
  tokenAdminCache = res.body.token;
  return tokenAdminCache;
}

// Token assinado localmente com um perfil (role) específico
function tokenComPerfil(role) {
  return jwt.sign({ id: 1, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

let seq = 0;
// Número de série único (máx. 25 caracteres) – evita colisão entre execuções
function serieUnica(tamanho = 12) {
  seq += 1;
  const base = (Date.now().toString(36) + seq.toString(36) + Math.random().toString(36).slice(2)).toUpperCase();
  return ("S" + base).padEnd(tamanho, "X").slice(0, tamanho);
}

function dataEmDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function payloadValido(extra = {}) {
  return {
    user_id: CLIENTE_ID,
    dispositivo: "Notebook Dell Inspiron 15",
    numero_serie: serieUnica(),
    tecnico: "Michel",
    prioridade: "Alta",
    previsao_conclusao: dataEmDias(7),
    descricao_problema: "Equipamento não liga",
    ...extra,
  };
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function criarServico(token, body) {
  const req = api().post("/api/servicos/criarServico");
  if (token) req.set(auth(token));
  return req.send(body);
}
async function listarServicos(token) {
  return api().get("/api/servicos/listarServico").set(auth(token));
}
async function buscarServico(token, id) {
  const res = await listarServicos(token);
  return res.body.find((s) => s.id === id);
}
async function editarServico(token, id, body) {
  return api().put(`/api/servicos/editarServico/${id}`).set(auth(token)).send(body);
}
async function listarClientes(token) {
  return api().get("/api/clientes/listaCliente?limit=1000").set(auth(token));
}
async function criarCliente(token, extra = {}) {
  const sufixo = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return api()
    .post("/api/clientes/criarCliente")
    .set(auth(token))
    .send({ nome: "Cliente de Teste", email: `teste_${sufixo}@bpg.com`, telefone: "11999990000",
            endereco: "Rua Teste, 100", cidade: "São Paulo", estado: "SP", ...extra });
}
// Garante que exista o cliente de id CLIENTE_ID
async function garantirCliente(token) {
  const res = await listarClientes(token);
  const existe = res.body.clientes && res.body.clientes.some((c) => c.id === CLIENTE_ID);
  if (!existe) await criarCliente(token);
}

module.exports = {
  BASE_URL, CLIENTE_ID, api, tokenAdmin, tokenComPerfil, serieUnica, dataEmDias, payloadValido,
  criarServico, listarServicos, buscarServico, editarServico, criarCliente, garantirCliente, listarClientes,
};
