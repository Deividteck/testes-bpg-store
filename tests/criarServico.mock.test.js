/**
 * CT#07 e CT#08 – fluxos de exceção E5 e E6 do GFC (falhas de persistência).
 * A falha de banco é simulada com mocks; a rota REAL (routes/serviceRoutes.js) é montada em um app Express de teste.
 */
jest.mock("../models", () => ({
  Service: { create: jest.fn(), destroy: jest.fn(), findAll: jest.fn(), update: jest.fn(), count: jest.fn() },
  Cliente: { findByPk: jest.fn() },
}));
jest.mock("../models/HistoricoAtendimento", () => ({ create: jest.fn() }), { virtual: true });
jest.mock("../Middleware/authenticateToken", () => (req, res, next) => { req.user = { id: 1, role: "ADMIN" }; next(); });

const express = require("express");
const request = require("supertest");
const { Service } = require("../models");
const Historico = require("../models/HistoricoAtendimento");
const router = require("../routes/serviceRoutes");

const app = express();
app.use(express.json());
app.use("/api/servicos", router);

const corpo = {
  user_id: 1, dispositivo: "Notebook", numero_serie: "SN123", tecnico: "Michel", prioridade: "Alta",
};

beforeEach(() => jest.clearAllMocks());

test("CT#07 Exceção E5: falha ao gravar o serviço deve retornar 500 e não gravar histórico [RN proposta]", async () => {
  Service.create.mockRejectedValue(new Error("falha de conexão com o banco"));
  const res = await request(app).post("/api/servicos/criarServico").send(corpo);
  expect(res.status).toBe(500);
  expect(Historico.create).not.toHaveBeenCalled();
});

test("CT#08 Exceção E6: falha ao gravar o histórico deve retornar 500 e desfazer o serviço (rollback) [RN proposta]", async () => {
  Service.create.mockResolvedValue({ id: 10, ...corpo, status_servico: "Pendente" });
  Historico.create.mockRejectedValue(new Error("falha ao gravar histórico"));
  const res = await request(app).post("/api/servicos/criarServico").send(corpo);
  expect(Historico.create).toHaveBeenCalledTimes(1);
  expect(res.status).toBe(500);
  expect(Service.destroy).toHaveBeenCalled();
});
