// Pacote: domain.enums – ENUM `tecnico` do MySQL.
const Tecnico = Object.freeze({ MICHEL: "Michel", CELSO: "Celso" });
const isTecnicoValido = (valor) => Object.values(Tecnico).includes(valor);
module.exports = { Tecnico, isTecnicoValido };
