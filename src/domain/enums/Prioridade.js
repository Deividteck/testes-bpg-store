// Pacote: domain.enums – ENUM `prioridade` do MySQL.
const Prioridade = Object.freeze({ BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" });
const isPrioridadeValida = (valor) => Object.values(Prioridade).includes(valor);
module.exports = { Prioridade, isPrioridadeValida };
