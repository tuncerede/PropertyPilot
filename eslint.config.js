// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*'],
  },
  {
    rules: {
      // Unused variables are already an error via TypeScript's
      // noUnusedLocals / noUnusedParameters, so this config stays lean.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The verification scripts are command-line tools; their console output is
    // the product, not a stray debug statement.
    files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
    rules: { 'no-console': 'off' },
  },
]);
