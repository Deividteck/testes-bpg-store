/**
 * Pacote: tests.unit.application.usecases
 * Classe sob teste: CriarServicoUseCase  (camada de APLICAÇÃO)
 *
 * GLOSSÁRIO DOS RECURSOS DE TESTE USADOS NESTE ARQUIVO
 *  • DRIVER – quem "dirige" a unidade sob teste. Aqui, cada `test(...)` é o driver: monta os dados,
 *             chama `useCase.executar(...)` e confere o resultado (não existe controller/rota nesta fase).
 *  • STUB   – dublê com resposta PRÉ-PROGRAMADA, sem verificar como foi chamado.
 *             Ex.: `clienteRepo.buscarPorId` sempre devolve o cliente (ou null). Usado para isolar o use case do banco.
 *  • MOCK   – dublê cujas INTERAÇÕES são verificadas (foi chamado? quantas vezes? com quais argumentos? em que ordem?).
 *             Ex.: `historicoRepo.salvar` – conferimos que foi chamado 1 vez com o histórico de abertura.
 *  • FAKE   – implementação funcional simplificada (em memória). Ex.: `FakeServicoRepository` no lugar do MySQL.
 *  • SPY    – `jest.spyOn` sobre o fake: mantém o comportamento real e ainda registra as chamadas.
 *  • Relógio injetado – a dependência `relogio` é um stub que congela "hoje" em 12/11/2026.
 *
 * Técnicas: Partição de Equivalência (PE), Análise de Valor Limite (AVL) e teste de fluxos (principal/alternativo/exceção).
 * Regras de negócio cobertas: RN-SRV-01, 03, 04, 16, 19 e 22 (ver documento de regras de negócio).
 */
const CriarServicoUseCase = require("../../../../src/application/usecases/CriarServicoUseCase");
const Servico = require("../../../../src/domain/entities/Servico");
const HistoricoAtendimento = require("../../../../src/domain/entities/HistoricoAtendimento");
const { StatusServico } = require("../../../../src/domain/enums/StatusServico");
const { Prioridade } = require("../../../../src/domain/enums/Prioridade");
const {
  DadosInvalidosError, ClienteNaoEncontradoError, SerieDuplicadaError, FalhaPersistenciaError,
} = require("../../../../src/application/errors/ApplicationError");
const FakeServicoRepository = require("../../doubles/FakeServicoRepository");
const { HOJE, emDias, dadosValidos, clienteExistente, servicoValido } = require("../../support/builders");

/** ARRANGE comum: monta o use case com todos os dublês. */
function montarCenario({ cliente = clienteExistente() } = {}) {
  const clienteRepo = { buscarPorId: jest.fn().mockResolvedValue(cliente) };      // STUB (cliente existe / null)
  const servicoRepo = new FakeServicoRepository();                                 // FAKE (banco em memória)
  jest.spyOn(servicoRepo, "salvar");                                               // SPY sobre o fake
  jest.spyOn(servicoRepo, "remover");                                              // SPY sobre o fake
  const historicoRepo = { salvar: jest.fn().mockResolvedValue(undefined) };        // MOCK (interação verificada)
  const relogio = () => HOJE;                                                      // STUB do relógio
  const useCase = new CriarServicoUseCase({ clienteRepo, servicoRepo, historicoRepo, relogio });
  return { useCase, clienteRepo, servicoRepo, historicoRepo };
}

/** Verifica que a promessa foi rejeitada com a classe de erro e o código HTTP esperados. */
async function esperarErro(promessa, Classe, codigoHttp) {
  await expect(promessa).rejects.toBeInstanceOf(Classe);
  await expect(promessa).rejects.toMatchObject({ codigoHttp });
}

describe("CriarServicoUseCase", () => {
  describe("construtor", () => {
    test.each(["clienteRepo", "servicoRepo", "historicoRepo"])("lança erro se faltar a dependência %s", (faltando) => {
      const deps = { clienteRepo: {}, servicoRepo: {}, historicoRepo: {} };
      delete deps[faltando];
      expect(() => new CriarServicoUseCase(deps)).toThrow("dependências obrigatórias");
    });
    test("lança erro se chamado sem argumentos", () => {
      expect(() => new CriarServicoUseCase()).toThrow();
    });
    test("usa o relógio do sistema quando nenhum é injetado", async () => {
      const { clienteRepo, servicoRepo, historicoRepo } = montarCenario();
      const useCase = new CriarServicoUseCase({ clienteRepo, servicoRepo, historicoRepo }); // sem relogio
      const servico = await useCase.executar(dadosValidos({ previsaoConclusao: undefined }));
      expect(servico.dataCriacao).toBeInstanceOf(Date);
    });
  });

  // ───────────────────────── Fluxo principal ─────────────────────────
  describe("executar() – fluxo principal (RN-SRV-03 e RN-SRV-19)", () => {
    test("cria o serviço Pendente, persiste 1 vez e devolve a entidade com id", async () => {
      const { useCase, servicoRepo } = montarCenario();
      const servico = await useCase.executar(dadosValidos());          // DRIVER

      expect(servico).toBeInstanceOf(Servico);
      expect(servico.id).toBe(1);                                      // id gerado pelo FAKE
      expect(servico.statusServico).toBe(StatusServico.PENDENTE);      // RN-SRV-03
      expect(servico.prioridade).toBe(Prioridade.ALTA);
      expect(servico.tecnico).toBe("Michel");
      expect(servicoRepo.salvar).toHaveBeenCalledTimes(1);             // verificação de interação
    });

    test("grava o histórico de abertura exatamente 1 vez, com o id do serviço (MOCK)", async () => {
      const { useCase, historicoRepo } = montarCenario();
      const servico = await useCase.executar(dadosValidos());

      expect(historicoRepo.salvar).toHaveBeenCalledTimes(1);
      const gravado = historicoRepo.salvar.mock.calls[0][0];
      expect(gravado).toBeInstanceOf(HistoricoAtendimento);
      expect(gravado).toMatchObject({ servicoId: servico.id, statusAtendimento: StatusServico.PENDENTE, descricao: "Serviço aberto" });
    });

    test("consulta o cliente pelo id informado (STUB verificado como MOCK)", async () => {
      const { useCase, clienteRepo } = montarCenario();
      await useCase.executar(dadosValidos({ clienteId: 1 }));
      expect(clienteRepo.buscarPorId).toHaveBeenCalledWith(1);
    });

    test("executa as etapas na ordem: cliente → salvar serviço → histórico", async () => {
      const { useCase, clienteRepo, servicoRepo, historicoRepo } = montarCenario();
      await useCase.executar(dadosValidos());
      const ordem = (fn) => fn.mock.invocationCallOrder[0];
      expect(ordem(clienteRepo.buscarPorId)).toBeLessThan(ordem(servicoRepo.salvar));
      expect(ordem(servicoRepo.salvar)).toBeLessThan(ordem(historicoRepo.salvar));
    });
  });

  // ───────────────────────── Fluxo alternativo A1 ─────────────────────────
  describe("executar() – fluxo alternativo A1 (RN-SRV-03: padrões)", () => {
    test("prioridade omitida assume 'Média'", async () => {
      const { useCase } = montarCenario();
      const servico = await useCase.executar(dadosValidos({ prioridade: undefined }));
      expect(servico.prioridade).toBe(Prioridade.MEDIA);
    });
    test("técnico e previsão omitidos são aceitos (ficam nulos)", async () => {
      const { useCase } = montarCenario();
      const servico = await useCase.executar(dadosValidos({ tecnico: undefined, previsaoConclusao: undefined }));
      expect(servico.tecnico).toBeNull();
      expect(servico.previsaoConclusao).toBeNull();
    });
    test("número de série é normalizado: sem espaços e em maiúsculas (RN-SRV-04)", async () => {
      const { useCase } = montarCenario();
      const servico = await useCase.executar(dadosValidos({ numeroSerie: "  sn 123 abc " }));
      expect(servico.numeroSerie).toBe("SN123ABC");
    });
  });

  // ───────────────────────── Exceção E2: validarDados ─────────────────────────
  describe("executar() – exceção E2: dados inválidos → DadosInvalidosError 400 (Partição de Equivalência)", () => {
    test.each([
      ["clienteId texto", { clienteId: "abc" }],
      ["clienteId zero", { clienteId: 0 }],
      ["clienteId negativo", { clienteId: -5 }],
      ["clienteId decimal", { clienteId: 1.5 }],
      ["clienteId ausente", { clienteId: undefined }],
      ["dispositivo vazio", { dispositivo: "" }],
      ["dispositivo só espaços", { dispositivo: "   " }],
      ["dispositivo ausente", { dispositivo: undefined }],
      ["dispositivo numérico", { dispositivo: 123 }],
      ["numeroSerie vazio", { numeroSerie: "" }],
      ["numeroSerie só espaços", { numeroSerie: "   " }],
      ["numeroSerie ausente", { numeroSerie: undefined }],
      ["técnico fora do conjunto", { tecnico: "Carlos" }],
      ["prioridade fora do conjunto", { prioridade: "Urgente" }],
      ["previsão com data inválida", { previsaoConclusao: new Date("31/12/2026") }],
      ["previsão que não é Date", { previsaoConclusao: "2026-12-31" }],
      ["previsão anterior à abertura (RN-SRV-16)", { previsaoConclusao: emDias(-1) }],
    ])("rejeita %s e NÃO acessa nenhum repositório", async (_nome, extra) => {
      const { useCase, clienteRepo, servicoRepo, historicoRepo } = montarCenario();
      await esperarErro(useCase.executar(dadosValidos(extra)), DadosInvalidosError, 400);
      // MOCKS: nada pode ter sido consultado nem gravado
      expect(clienteRepo.buscarPorId).not.toHaveBeenCalled();
      expect(servicoRepo.salvar).not.toHaveBeenCalled();
      expect(historicoRepo.salvar).not.toHaveBeenCalled();
    });

    test.each([[null], [undefined], ["texto"]])("rejeita dados que não são objeto: %p", async (dados) => {
      const { useCase } = montarCenario();
      await esperarErro(useCase.executar(dados), DadosInvalidosError, 400);
    });

    test("acumula todos os erros encontrados em uma única exceção", async () => {
      const { useCase } = montarCenario();
      const promessa = useCase.executar(dadosValidos({ clienteId: "x", dispositivo: "", tecnico: "Carlos" }));
      await expect(promessa).rejects.toMatchObject({ erros: expect.arrayContaining([
        expect.stringContaining("clienteId"), expect.stringContaining("dispositivo"), expect.stringContaining("tecnico"),
      ]) });
    });
  });

  // ───────────────────────── Análise de Valor Limite ─────────────────────────
  describe("executar() – Análise de Valor Limite", () => {
    test.each([[1, true], [25, true], [26, false]])("numeroSerie com %i caractere(s) → aceito=%s", async (n, aceito) => {
      const { useCase } = montarCenario();
      const chamada = useCase.executar(dadosValidos({ numeroSerie: "A".repeat(n) }));
      if (aceito) await expect(chamada).resolves.toBeInstanceOf(Servico);
      else await esperarErro(chamada, DadosInvalidosError, 400);
    });
    test.each([[1, true], [200, true], [201, false]])("dispositivo com %i caractere(s) → aceito=%s", async (n, aceito) => {
      const { useCase } = montarCenario();
      const chamada = useCase.executar(dadosValidos({ dispositivo: "D".repeat(n) }));
      if (aceito) await expect(chamada).resolves.toBeInstanceOf(Servico);
      else await esperarErro(chamada, DadosInvalidosError, 400);
    });
    test.each([[0, true], [-1, false]])("previsão %i dia(s) em relação a hoje → aceita=%s (RN-SRV-16)", async (dias, aceita) => {
      const { useCase } = montarCenario();
      const chamada = useCase.executar(dadosValidos({ previsaoConclusao: emDias(dias) }));
      if (aceita) await expect(chamada).resolves.toBeInstanceOf(Servico);
      else await esperarErro(chamada, DadosInvalidosError, 400);
    });
  });

  // ───────────────────────── Exceção E3: buscarCliente ─────────────────────────
  describe("executar() – exceção E3: cliente inexistente → ClienteNaoEncontradoError 404 (RN-SRV-01)", () => {
    test("não grava serviço nem histórico", async () => {
      const { useCase, servicoRepo, historicoRepo } = montarCenario({ cliente: null }); // STUB devolve null
      await esperarErro(useCase.executar(dadosValidos({ clienteId: 999 })), ClienteNaoEncontradoError, 404);
      expect(servicoRepo.salvar).not.toHaveBeenCalled();
      expect(historicoRepo.salvar).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────── Exceção E4: verificarSerie ─────────────────────────
  describe("executar() – exceção E4: série já em serviço aberto → SerieDuplicadaError 409 (RN-SRV-04)", () => {
    test.each([
      [StatusServico.PENDENTE], [StatusServico.EM_DIAGNOSTICO],
      [StatusServico.AGUARDANDO_PECAS], [StatusServico.EM_ANDAMENTO],
    ])("bloqueia quando já existe serviço %s com o mesmo nº de série", async (status) => {
      const { useCase, servicoRepo, historicoRepo } = montarCenario();
      servicoRepo.semear(servicoValido({ numeroSerie: "SN12345", statusServico: status })); // FAKE pré-populado
      servicoRepo.salvar.mockClear();
      await esperarErro(useCase.executar(dadosValidos({ numeroSerie: "sn 12345" })), SerieDuplicadaError, 409);
      expect(servicoRepo.salvar).not.toHaveBeenCalled();
      expect(historicoRepo.salvar).not.toHaveBeenCalled();
    });
    test.each([[StatusServico.CONCLUIDO], [StatusServico.CANCELADO]])(
      "permite quando o serviço anterior com a mesma série está %s (não está aberto)", async (status) => {
        const { useCase, servicoRepo } = montarCenario();
        servicoRepo.semear(servicoValido({ numeroSerie: "SN12345", statusServico: status }));
        await expect(useCase.executar(dadosValidos())).resolves.toBeInstanceOf(Servico);
      });
  });

  // ───────────────────────── Exceção E5: falha ao gravar o serviço ─────────────────────────
  describe("executar() – exceção E5: falha ao gravar o serviço → FalhaPersistenciaError 500", () => {
    test("não grava histórico e preserva a causa original", async () => {
      const { useCase, servicoRepo, historicoRepo } = montarCenario();
      const causa = new Error("conexão perdida");
      servicoRepo.salvar.mockRejectedValueOnce(causa);                 // força a falha (STUB de erro)
      const promessa = useCase.executar(dadosValidos());
      await esperarErro(promessa, FalhaPersistenciaError, 500);
      await expect(promessa).rejects.toMatchObject({ causa });
      expect(historicoRepo.salvar).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────── Exceção E6: falha ao gravar o histórico ─────────────────────────
  describe("executar() – exceção E6: falha ao gravar o histórico → 500 e compensação (RN-SRV-22)", () => {
    test("desfaz o serviço já gravado (remover) e não o deixa 'órfão'", async () => {
      const { useCase, servicoRepo, historicoRepo } = montarCenario();
      historicoRepo.salvar.mockRejectedValueOnce(new Error("falha no histórico")); // MOCK programado para falhar
      await esperarErro(useCase.executar(dadosValidos()), FalhaPersistenciaError, 500);

      expect(servicoRepo.remover).toHaveBeenCalledTimes(1);            // compensação chamada
      expect(servicoRepo.remover).toHaveBeenCalledWith(1);             // com o id do serviço criado
      expect(servicoRepo.itens.size).toBe(0);                          // estado do FAKE: nada ficou gravado
    });
  });
});
