// Rodar a partir da raiz do projeto:  npx jest -c tests/jest.config.js --runInBand
module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testTimeout: 30000,
};
