// Pacote: tests.unit.domain.enums
// Garante que os enums do domínio espelham EXATAMENTE os ENUMs do MySQL (acentos inclusos).
const { StatusServico, STATUS_ABERTOS, isStatusValido } = require("../../../../src/domain/enums/StatusServico");
const { Prioridade, isPrioridadeValida } = require("../../../../src/domain/enums/Prioridade");
const { Tecnico, isTecnicoValido } = require("../../../../src/domain/enums/Tecnico");

describe("StatusServico", () => {
  test("valores idênticos ao ENUM status_servico do banco", () => {
    expect(Object.values(StatusServico)).toEqual(
      ["Pendente", "Em diagnóstico", "Aguardando peças", "Em andamento", "Concluído", "Cancelado"]);
  });
  test("STATUS_ABERTOS exclui Concluído e Cancelado (regra do dashboard)", () => {
    expect(STATUS_ABERTOS).toEqual(["Pendente", "Em diagnóstico", "Aguardando peças", "Em andamento"]);
  });
  test("isStatusValido aceita os 6 valores e rejeita outros", () => {
    Object.values(StatusServico).forEach((s) => expect(isStatusValido(s)).toBe(true));
    ["EM_ATENDIMENTO", "pendente", "", null, undefined].forEach((s) => expect(isStatusValido(s)).toBe(false));
  });
  test("é imutável", () => { expect(Object.isFrozen(StatusServico)).toBe(true); });
});

describe("Prioridade", () => {
  test("valores idênticos ao ENUM prioridade", () => { expect(Object.values(Prioridade)).toEqual(["Baixa", "Média", "Alta"]); });
  test("validação", () => {
    expect(isPrioridadeValida("Média")).toBe(true);
    expect(isPrioridadeValida("Media")).toBe(false);
    expect(isPrioridadeValida("Urgente")).toBe(false);
  });
});

describe("Tecnico", () => {
  test("valores idênticos ao ENUM tecnico", () => { expect(Object.values(Tecnico)).toEqual(["Michel", "Celso"]); });
  test("validação", () => {
    expect(isTecnicoValido("Celso")).toBe(true);
    expect(isTecnicoValido("Carlos")).toBe(false);
  });
});
