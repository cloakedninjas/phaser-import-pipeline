module.exports = {
  'env': {
    'es6': true,
    'node': true,
    'jest': true
  },
  extends: [
    'eslint:recommended'
  ],
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  rules: {
    'object-curly-spacing': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': ['error'],
    'no-multiple-empty-lines': ['error', { 'max': 1 }]
  }
};
