// Pacote: tests.unit.application.ports – as "interfaces" abstratas devem exigir implementação.
const IClienteRepository = require("../../../../src/application/ports/IClienteRepository");
const IServicoRepository = require("../../../../src/application/ports/IServicoRepository");
const IHistoricoRepository = require("../../../../src/application/ports/IHistoricoRepository");

describe("portas (interfaces de repositório)", () => {
  test.each([
    ["IClienteRepository.buscarPorId", () => new IClienteRepository().buscarPorId(1)],
    ["IServicoRepository.salvar", () => new IServicoRepository().salvar({})],
    ["IServicoRepository.buscarAberto", () => new IServicoRepository().buscarAberto("X")],
    ["IServicoRepository.remover", () => new IServicoRepository().remover(1)],
    ["IHistoricoRepository.salvar", () => new IHistoricoRepository().salvar({})],
  ])("%s lança 'não implementado'", async (_nome, chamar) => {
    await expect(chamar()).rejects.toThrow("não implementado");
  });
});
