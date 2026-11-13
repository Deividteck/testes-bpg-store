// Pacote: domain.entities – tabela `historico_atendimentos`.
const DominioError = require("../errors/DominioError");
const { isStatusValido } = require("../enums/StatusServico");
const { isTecnicoValido } = require("../enums/Tecnico");

class HistoricoAtendimento {
  constructor({ id = null, servicoId, dataAtendimento = new Date(), descricao = null, statusAtendimento, tecnico = null, observacoes = null }) {
    if (!Number.isInteger(servicoId) || servicoId <= 0) throw new DominioError("Historico: servicoId deve ser inteiro positivo");
    if (!isStatusValido(statusAtendimento)) throw new DominioError("Historico: status inválido");
    if (tecnico !== null && !isTecnicoValido(tecnico)) throw new DominioError("Historico: técnico inválido");
    Object.assign(this, { id, servicoId, dataAtendimento, descricao, statusAtendimento, tecnico, observacoes });
  }

  /** Fábrica: registro automático de abertura (RN-SRV-19). */
  static deAbertura(servico, agora = new Date()) {
    return new HistoricoAtendimento({
      servicoId: servico.id,
      dataAtendimento: agora,
      descricao: "Serviço aberto",
      statusAtendimento: servico.statusServico,
      tecnico: servico.tecnico,
    });
  }
}
module.exports = HistoricoAtendimento;
