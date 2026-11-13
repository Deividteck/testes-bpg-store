// Pacote: domain.enums – valores idênticos ao ENUM `status_servico` do MySQL (tabela servicos).
const StatusServico = Object.freeze({
  PENDENTE: "Pendente",
  EM_DIAGNOSTICO: "Em diagnóstico",
  AGUARDANDO_PECAS: "Aguardando peças",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
});

// Status considerados "em aberto" (mesma regra de /quantidadeServico e do dashboard).
const STATUS_ABERTOS = Object.freeze([
  StatusServico.PENDENTE,
  StatusServico.EM_DIAGNOSTICO,
  StatusServico.AGUARDANDO_PECAS,
  StatusServico.EM_ANDAMENTO,
]);

const isStatusValido = (valor) => Object.values(StatusServico).includes(valor);

module.exports = { StatusServico, STATUS_ABERTOS, isStatusValido };
