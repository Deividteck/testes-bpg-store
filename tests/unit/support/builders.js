// Pacote: tests.unit.support – construtores de dados de teste (test data builders).
const CriarServicoDTO = require("../../../src/application/dto/CriarServicoDTO");
const Servico = require("../../../src/domain/entities/Servico");
const Cliente = require("../../../src/domain/entities/Cliente");
const { Prioridade } = require("../../../src/domain/enums/Prioridade");
const { Tecnico } = require("../../../src/domain/enums/Tecnico");

// "Hoje" fixo (12/11/2026) para os testes não dependerem do relógio real.
const HOJE = new Date(2026, 10, 12, 10, 0, 0);
const emDias = (n) => new Date(2026, 10, 12 + n, 10, 0, 0);

const dadosValidos = (extra = {}) =>
  new CriarServicoDTO({
    clienteId: 1, dispositivo: "Notebook Dell Inspiron 15", numeroSerie: "SN12345",
    tecnico: Tecnico.MICHEL, prioridade: Prioridade.ALTA, previsaoConclusao: emDias(7),
    descricaoProblema: "Equipamento não liga", ...extra,
  });

const clienteExistente = () =>
  new Cliente({ id: 1, nome: "Maria Silva", email: "maria@bpg.com", telefone: "11999990000",
                endereco: "Rua A, 10", cidade: "São Paulo", estado: "SP" });

const servicoValido = (extra = {}) =>
  new Servico({ clienteId: 1, dispositivo: "Notebook", numeroSerie: "SN1", prioridade: Prioridade.MEDIA, dataCriacao: HOJE, ...extra });

module.exports = { HOJE, emDias, dadosValidos, clienteExistente, servicoValido };
