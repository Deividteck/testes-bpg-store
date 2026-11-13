// Pacote: domain.entities – tabela `servicos`. Protege as invariantes do serviço de assistência.
const DominioError = require("../errors/DominioError");
const { StatusServico, STATUS_ABERTOS, isStatusValido } = require("../enums/StatusServico");
const { isPrioridadeValida } = require("../enums/Prioridade");
const { isTecnicoValido } = require("../enums/Tecnico");

const LIMITE_DISPOSITIVO = 200; // VARCHAR(200)
const LIMITE_SERIE = 25; // VARCHAR(25)
const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

class Servico {
  constructor({
    id = null, clienteId, dispositivo, numeroSerie, tecnico = null,
    statusServico = StatusServico.PENDENTE, prioridade, previsaoConclusao = null,
    descricaoProblema = null, observacaoTecnica = null, dataCriacao = new Date(),
  }) {
    if (!Number.isInteger(clienteId) || clienteId <= 0) throw new DominioError("Servico: clienteId deve ser inteiro positivo");
    if (typeof dispositivo !== "string" || dispositivo.trim() === "" || dispositivo.length > LIMITE_DISPOSITIVO)
      throw new DominioError(`Servico: dispositivo deve ter de 1 a ${LIMITE_DISPOSITIVO} caracteres`);
    if (typeof numeroSerie !== "string" || numeroSerie.length < 1 || numeroSerie.length > LIMITE_SERIE)
      throw new DominioError(`Servico: numeroSerie deve ter de 1 a ${LIMITE_SERIE} caracteres`);
    if (tecnico !== null && !isTecnicoValido(tecnico)) throw new DominioError("Servico: técnico inválido");
    if (!isStatusValido(statusServico)) throw new DominioError("Servico: status inválido");
    if (!isPrioridadeValida(prioridade)) throw new DominioError("Servico: prioridade inválida");
    if (previsaoConclusao !== null) {
      if (!(previsaoConclusao instanceof Date) || Number.isNaN(previsaoConclusao.getTime()))
        throw new DominioError("Servico: previsaoConclusao inválida");
      if (inicioDoDia(previsaoConclusao) < inicioDoDia(dataCriacao))
        throw new DominioError("Servico: previsaoConclusao não pode ser anterior à abertura");
    }
    Object.assign(this, {
      id, clienteId, dispositivo, numeroSerie, tecnico, statusServico, prioridade,
      previsaoConclusao, descricaoProblema, observacaoTecnica, dataCriacao,
    });
  }

  /** Serviço em aberto = ainda não Concluído nem Cancelado. */
  estaAberto() {
    return STATUS_ABERTOS.includes(this.statusServico);
  }
}
module.exports = Servico;
