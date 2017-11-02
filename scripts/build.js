const rollup = require('rollup')
const resolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const replace = require('rollup-plugin-replace')
const builtins = require('rollup-plugin-node-builtins')

const fs = require('fs')
const nordnetPublicKey = fs.readFileSync('./NEXTAPI_TEST_public.pem')

const output = {
  format: 'umd',
  name: 'Nordnet',
  intro: `const nordnetPublicKey = \`${nordnetPublicKey}\``
}

const input = {
  input: 'lib/index.js',
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    builtins(),
    resolve({
      preferBuiltins: true
    }),
    babel({
      exclude: 'node_modules/**',
    })
  ]
}

rollup
  .rollup(input)
  .then(bundle => bundle.write(Object.assign(output, { file: 'dist/index.js' })))
