// Pacote: tests.unit.application.dto – CriarServicoDTO (mapeamento do JSON da rota).
const CriarServicoDTO = require("../../../../src/application/dto/CriarServicoDTO");

describe("CriarServicoDTO.fromRequest", () => {
  test("converte snake_case do corpo da requisição para camelCase", () => {
    const dto = CriarServicoDTO.fromRequest({
      user_id: 3, dispositivo: "TV", numero_serie: "ABC", tecnico: "Celso", prioridade: "Alta",
      previsao_conclusao: "2026-12-31", descricao_problema: "sem imagem", observacao_tecnica: "obs",
    });
    expect(dto).toMatchObject({ clienteId: 3, dispositivo: "TV", numeroSerie: "ABC", tecnico: "Celso",
                                prioridade: "Alta", descricaoProblema: "sem imagem", observacaoTecnica: "obs" });
    expect(dto.previsaoConclusao).toBeInstanceOf(Date);
  });
  test("ignora status_servico (RN-SRV-03: o serviço sempre nasce Pendente)", () => {
    const dto = CriarServicoDTO.fromRequest({ user_id: 1, status_servico: "Concluído" });
    expect(dto).not.toHaveProperty("statusServico");
    expect(Object.values(dto)).not.toContain("Concluído");
  });
  test("campos ausentes ficam undefined; corpo vazio não quebra", () => {
    const dto = CriarServicoDTO.fromRequest();
    expect(dto.clienteId).toBeUndefined();
    expect(dto.previsaoConclusao).toBeUndefined();
  });
  test("previsão em formato inválido vira Date inválida (a validação é do caso de uso)", () => {
    const dto = CriarServicoDTO.fromRequest({ previsao_conclusao: "31/12/2026" });
    expect(Number.isNaN(dto.previsaoConclusao.getTime())).toBe(true);
  });
});
