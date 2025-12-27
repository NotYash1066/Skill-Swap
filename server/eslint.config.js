const js = require("@eslint/js");
const globals = require("globals");
const jest = require("eslint-plugin-jest");

module.exports = [
  {
    ignores: ["node_modules/", "uploads/", "coverage/"]
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      jest
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "error",
      "no-useless-escape": "off"
    }
  },
  {
    files: ["tests/**/*.js"],
    ...jest.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
];