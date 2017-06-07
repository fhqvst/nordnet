var path = require('path');

module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "airbnb"
  ],
  "plugins": [
    "react",
    "jsx-a11y",
    "import",
    "babel"
  ],
  "rules": {
    "generator-star-spacing": 0,
    "semi": ["error", "never"],
    "indent": ["error", 2],
    "no-underscore-dangle": ["off", { "allow": ["_id"] }],
    "no-cond-assign": ["error", "except-parens"],
    "new-cap": ["error", { "capIsNewExceptions": ["Router", "ObjectId"] }],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "next|reject" }],
    "no-console": 0,
    "consistent-return": 0,
    "no-param-reassign": 0,
    "no-use-before-define": ["error", { "functions": false }],
    "comma-dangle": ["error", "never"],
    "arrow-parens": 0,
    "padded-blocks": 0,
    "func-names": 0,
    "no-restricted-syntax": 0,
    "jsx-a11y/anchor-has-content": 0,
    "import/no-named-as-default-member": 0,
    "import/no-extraneous-dependencies": ["error", {"devDependencies": ["**/tests/**/*.js", "**/scripts/**/*.js"]}],
    "babel/arrow-parens": 0 // TODO: Replace with [2, "as-needed", { "requireForBlockBody": true }] (https://github.com/babel/eslint-plugin-babel/issues/90)
  },
  "settings": {
    "import/resolver": {
      "node": {
        "paths": [path.resolve(__dirname, 'lib')]
      }
    }
  }
}
