// eslint.config.js
import importPlugin from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // En ESLint 9, las reglas de plugins se referencian igual, pero deben estar dentro del mismo objeto que define 'plugins'
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Domain NO puede importar nada de afuera (Domain es el centro)
            { 
              target: './src/domain', 
              from: './src/presentation', 
              message: 'El Dominio no debe depender de la UI (Presentation).' 
            },
            { 
              target: './src/domain', 
              from: './src/infrastructure', 
              message: 'El Dominio no debe depender de la Infraestructura.' 
            },
            { 
              target: './src/domain', 
              from: './src/application', 
              message: 'El Dominio no debe depender de los Casos de Uso (Application).' 
            },

            // Application NO puede mirar a capas externas
            { 
              target: './src/application', 
              from: './src/presentation', 
              message: 'La Aplicación no debe depender de la UI (Presentation).' 
            },
            { 
              target: './src/application', 
              from: './src/infrastructure', 
              message: 'La Aplicación no debe depender de la Infraestructura.' 
            },
          ],
        },
      ],
    },
  },
];