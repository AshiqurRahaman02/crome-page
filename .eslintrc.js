module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'standard',
  plugins: ['@html-eslint'],
  overrides: [
    {
      files: ['*.html'],
      parser: '@html-eslint/parser',
      extends: ['plugin:@html-eslint/recommended']
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
  }
}
