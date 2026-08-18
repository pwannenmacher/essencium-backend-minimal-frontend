import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Debug-Logs sind zweimal als Datenleck aufgefallen (Cookies beim Login,
      // Session-Token-Dump aller Benutzer). console.error/warn bleiben erlaubt.
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },
  {
    // Context-Dateien exportieren bewusst Context + Hook neben der Provider-
    // Komponente. Das kostet Fast Refresh in genau diesen zwei Dateien; ein
    // Aufsplitten würde die Importe der halben App anfassen, ohne Laufzeit-
    // oder Testnutzen.
    files: ['src/context/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', '**/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
];
