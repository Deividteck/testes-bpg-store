// Pacote: tests.unit.domain.entities – classe HistoricoAtendimento (RN-SRV-19: histórico automático).
const HistoricoAtendimento = require("../../../../src/domain/entities/HistoricoAtendimento");
const DominioError = require("../../../../src/domain/errors/DominioError");
const { StatusServico } = require("../../../../src/domain/enums/StatusServico");
const { Tecnico } = require("../../../../src/domain/enums/Tecnico");
const { HOJE, servicoValido } = require("../../support/builders");

describe("HistoricoAtendimento", () => {
  test("cria registro válido com data padrão", () => {
    const h = new HistoricoAtendimento({ servicoId: 10, statusAtendimento: StatusServico.PENDENTE });
    expect(h.dataAtendimento).toBeInstanceOf(Date);
    expect(h.tecnico).toBeNull();
  });
  test.each([[0], [-1], [1.5], ["10"], [undefined]])("rejeita servicoId inválido: %p", (servicoId) => {
    expect(() => new HistoricoAtendimento({ servicoId, statusAtendimento: StatusServico.PENDENTE })).toThrow(DominioError);
  });
  test("rejeita status e técnico inválidos", () => {
    expect(() => new HistoricoAtendimento({ servicoId: 1, statusAtendimento: "x" })).toThrow(DominioError);
    expect(() => new HistoricoAtendimento({ servicoId: 1, statusAtendimento: StatusServico.PENDENTE, tecnico: "Carlos" })).toThrow(DominioError);
  });
  test("deAbertura copia id, status e técnico do serviço (fábrica)", () => {
    const servico = servicoValido({ id: 77, tecnico: Tecnico.CELSO });
    const h = HistoricoAtendimento.deAbertura(servico, HOJE);
    expect(h).toMatchObject({ servicoId: 77, statusAtendimento: StatusServico.PENDENTE, tecnico: Tecnico.CELSO, descricao: "Serviço aberto" });
    expect(h.dataAtendimento).toBe(HOJE);
  });
});
