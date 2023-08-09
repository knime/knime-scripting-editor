// This is a workaround for https://github.com/eslint/eslint/issues/3458
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: [
    "@knime/eslint-config/vue3-typescript",
    "@knime/eslint-config/vitest",
  ],
  globals: {
    consola: true,
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
      },
      alias: {
        map: [["@", "src/."]],
      },
    },
  },
  rules: {
    // TODO: turn this on again after fixing splitpanes import problems
    "import/extensions": "off",
  },
};
