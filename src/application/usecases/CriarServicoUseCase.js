// Pacote: application.usecases – lógica do caso de uso "Criar Serviço" (fluxos do diagrama de atividades).
const Servico = require("../../domain/entities/Servico");
const HistoricoAtendimento = require("../../domain/entities/HistoricoAtendimento");
const { StatusServico } = require("../../domain/enums/StatusServico");
const { Prioridade, isPrioridadeValida } = require("../../domain/enums/Prioridade");
const { isTecnicoValido } = require("../../domain/enums/Tecnico");
const {
  DadosInvalidosError, ClienteNaoEncontradoError, SerieDuplicadaError, FalhaPersistenciaError,
} = require("../errors/ApplicationError");

const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const normalizarSerie = (s) => (typeof s === "string" ? s.replace(/\s+/g, "").toUpperCase() : s);

class CriarServicoUseCase {
  /**
   * @param {{clienteRepo, servicoRepo, historicoRepo, relogio?: () => Date}} deps
   *  `relogio` é injetado para o teste controlar a data "de hoje".
   */
  constructor({ clienteRepo, servicoRepo, historicoRepo, relogio = () => new Date() } = {}) {
    if (!clienteRepo || !servicoRepo || !historicoRepo) throw new Error("CriarServicoUseCase: dependências obrigatórias ausentes");
    Object.assign(this, { clienteRepo, servicoRepo, historicoRepo, relogio });
  }

  /** Fluxo principal + alternativo (A1) + exceções E2..E6 do diagrama de atividades. */
  async executar(dados) {
    this._validarDados(dados);                                   // E2 – 400
    await this._buscarCliente(dados.clienteId);                  // E3 – 404
    const serie = normalizarSerie(dados.numeroSerie);
    await this._verificarSerie(serie);                           // E4 – 409
    const servico = this._montarServico(dados, serie);           // A1 – prioridade padrão
    let salvo;
    try {
      salvo = await this.servicoRepo.salvar(servico);            // E5 – 500
    } catch (causa) {
      throw new FalhaPersistenciaError("Falha ao gravar o serviço", causa);
    }
    try {
      await this._registrarAbertura(salvo);                      // E6 – 500 + compensação
    } catch (causa) {
      await this.servicoRepo.remover(salvo.id);
      throw new FalhaPersistenciaError("Falha ao gravar o histórico; serviço desfeito", causa);
    }
    return salvo;
  }

  _validarDados(d) {
    const erros = [];
    if (!d || typeof d !== "object") throw new DadosInvalidosError(["dados do serviço são obrigatórios"]);
    if (!Number.isInteger(d.clienteId) || d.clienteId <= 0) erros.push("clienteId deve ser inteiro positivo");
    if (typeof d.dispositivo !== "string" || d.dispositivo.trim() === "") erros.push("dispositivo é obrigatório");
    else if (d.dispositivo.length > 200) erros.push("dispositivo deve ter no máximo 200 caracteres");
    const serie = normalizarSerie(d.numeroSerie);
    if (typeof serie !== "string" || serie === "") erros.push("numeroSerie é obrigatório");
    else if (serie.length > 25) erros.push("numeroSerie deve ter no máximo 25 caracteres");
    if (d.tecnico !== undefined && d.tecnico !== null && !isTecnicoValido(d.tecnico)) erros.push("tecnico inválido");
    if (d.prioridade !== undefined && d.prioridade !== null && !isPrioridadeValida(d.prioridade)) erros.push("prioridade inválida");
    if (d.previsaoConclusao !== undefined && d.previsaoConclusao !== null) {
      if (!(d.previsaoConclusao instanceof Date) || Number.isNaN(d.previsaoConclusao.getTime())) erros.push("previsaoConclusao inválida");
      else if (inicioDoDia(d.previsaoConclusao) < inicioDoDia(this.relogio())) erros.push("previsaoConclusao não pode ser anterior à abertura");
    }
    if (erros.length) throw new DadosInvalidosError(erros);
  }

  async _buscarCliente(clienteId) {
    const cliente = await this.clienteRepo.buscarPorId(clienteId);
    if (!cliente) throw new ClienteNaoEncontradoError(clienteId);
    return cliente;
  }

  async _verificarSerie(serie) {
    const aberto = await this.servicoRepo.buscarAberto(serie);
    if (aberto) throw new SerieDuplicadaError(serie);
  }

  _montarServico(d, serie) {
    return new Servico({
      clienteId: d.clienteId,
      dispositivo: d.dispositivo,
      numeroSerie: serie,
      tecnico: d.tecnico ?? null,
      statusServico: StatusServico.PENDENTE,                    // RN-SRV-03: sempre nasce Pendente
      prioridade: d.prioridade ?? Prioridade.MEDIA,             // RN-SRV-03: padrão Média
      previsaoConclusao: d.previsaoConclusao ?? null,
      descricaoProblema: d.descricaoProblema ?? null,
      observacaoTecnica: d.observacaoTecnica ?? null,
      dataCriacao: this.relogio(),
    });
  }

  async _registrarAbertura(servico) {
    await this.historicoRepo.salvar(HistoricoAtendimento.deAbertura(servico, this.relogio()));
  }
}
module.exports = CriarServicoUseCase;
