// Testes de UNIDADE (sem banco e sem servidor). Rodar na raiz do projeto:
//   npx jest -c tests/jest.unit.config.js --coverage
module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageReporters: ["text"],
};
