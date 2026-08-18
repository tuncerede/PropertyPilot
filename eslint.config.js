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
  {
    // Jest injects its globals; the .ts suites get them from @types/jest,
    // which does not cover the ESM test files.
    files: ['tests/**/*.mjs'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
]);
