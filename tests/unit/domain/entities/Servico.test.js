// Pacote: tests.unit.domain.entities – classe Servico (invariantes e estaAberto).
// Aqui NÃO há mocks: a entidade não depende de nada externo, então é testada diretamente.
const Servico = require("../../../../src/domain/entities/Servico");
const DominioError = require("../../../../src/domain/errors/DominioError");
const { StatusServico } = require("../../../../src/domain/enums/StatusServico");
const { Prioridade } = require("../../../../src/domain/enums/Prioridade");
const { HOJE, emDias, servicoValido } = require("../../support/builders");

describe("Servico – criação", () => {
  test("cria com valores padrão: status Pendente, sem técnico, com data de criação", () => {
    const s = new Servico({ clienteId: 1, dispositivo: "Notebook", numeroSerie: "SN1", prioridade: Prioridade.ALTA });
    expect(s.statusServico).toBe(StatusServico.PENDENTE);
    expect(s.tecnico).toBeNull();
    expect(s.dataCriacao).toBeInstanceOf(Date);
    expect(s.id).toBeNull();
  });

  describe("invariantes (Partição de Equivalência)", () => {
    test.each([
      ["clienteId zero", { clienteId: 0 }],
      ["clienteId decimal", { clienteId: 1.5 }],
      ["clienteId texto", { clienteId: "1" }],
      ["clienteId ausente", { clienteId: undefined }],
      ["dispositivo vazio", { dispositivo: "" }],
      ["dispositivo só espaços", { dispositivo: "   " }],
      ["dispositivo não string", { dispositivo: 123 }],
      ["numeroSerie vazio", { numeroSerie: "" }],
      ["numeroSerie ausente", { numeroSerie: undefined }],
      ["técnico fora do enum", { tecnico: "Carlos" }],
      ["status fora do enum", { statusServico: "Finalizado" }],
      ["prioridade ausente", { prioridade: undefined }],
      ["prioridade fora do enum", { prioridade: "Urgente" }],
      ["previsão com data inválida", { previsaoConclusao: new Date("31/12/2026") }],
      ["previsão que não é Date", { previsaoConclusao: "2026-12-31" }],
    ])("rejeita %s", (_nome, extra) => {
      expect(() => servicoValido(extra)).toThrow(DominioError);
    });
  });

  describe("limites (Análise de Valor Limite)", () => {
    test.each([[1, true], [25, true], [26, false]])("numeroSerie com %i caractere(s) → válido=%s", (n, ok) => {
      const criar = () => servicoValido({ numeroSerie: "S".repeat(n) });
      ok ? expect(criar).not.toThrow() : expect(criar).toThrow(DominioError);
    });
    test.each([[1, true], [200, true], [201, false]])("dispositivo com %i caractere(s) → válido=%s", (n, ok) => {
      const criar = () => servicoValido({ dispositivo: "D".repeat(n) });
      ok ? expect(criar).not.toThrow() : expect(criar).toThrow(DominioError);
    });
    test("previsão no mesmo dia da abertura é aceita; um dia antes é rejeitada", () => {
      expect(() => servicoValido({ previsaoConclusao: HOJE })).not.toThrow();
      expect(() => servicoValido({ previsaoConclusao: emDias(-1) })).toThrow(DominioError);
    });
  });
});

describe("Servico.estaAberto()", () => {
  test.each([
    [StatusServico.PENDENTE, true], [StatusServico.EM_DIAGNOSTICO, true],
    [StatusServico.AGUARDANDO_PECAS, true], [StatusServico.EM_ANDAMENTO, true],
    [StatusServico.CONCLUIDO, false], [StatusServico.CANCELADO, false],
  ])("status %s → aberto=%s", (status, esperado) => {
    expect(servicoValido({ statusServico: status }).estaAberto()).toBe(esperado);
  });
});
