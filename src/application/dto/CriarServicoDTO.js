// Pacote: application.dto – dados de entrada do caso de uso "Criar Serviço".
class CriarServicoDTO {
  constructor({ clienteId, dispositivo, numeroSerie, tecnico, prioridade, previsaoConclusao, descricaoProblema, observacaoTecnica } = {}) {
    Object.assign(this, { clienteId, dispositivo, numeroSerie, tecnico, prioridade, previsaoConclusao, descricaoProblema, observacaoTecnica });
  }

  /** Converte o corpo JSON da rota (snake_case) para o DTO. `status_servico` é ignorado de propósito (RN-SRV-03). */
  static fromRequest(body = {}) {
    return new CriarServicoDTO({
      clienteId: body.user_id,
      dispositivo: body.dispositivo,
      numeroSerie: body.numero_serie,
      tecnico: body.tecnico,
      prioridade: body.prioridade,
      previsaoConclusao: body.previsao_conclusao === undefined || body.previsao_conclusao === null
        ? undefined : new Date(body.previsao_conclusao),
      descricaoProblema: body.descricao_problema,
      observacaoTecnica: body.observacao_tecnica,
    });
  }
}
module.exports = CriarServicoDTO;
