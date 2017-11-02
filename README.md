# Nordnet

An improved Node.js wrapper around the Nordnet nExt test API.

[![Version npm](https://img.shields.io/npm/v/nordnet.svg)](https://www.npmjs.com/package/nordnet)
[![Dependency Status](https://david-dm.org/fhqvst/nordnet.svg)](https://david-dm.org/fhqvst/nordnet)
[![devDependency Status](https://david-dm.org/fhqvst/nordnet/dev-status.svg)](https://david-dm.org/fhqvst/nordnet#info=devDependencies)

## Improvements

- Authenticate directly in the client
- Automatic session refresh
- Built-in feed support

## Table of Contents

* [Installation](#installation)
* [Documentation](#documentation)
* [Examples](#examples)
* [Responsibilities](#responsibilities)
* [Changelog](#changelog)
* [License](#license)

## Installation

Install via [npm](https://www.npmjs.com/package/nordnet)

```bash
$ npm install nordnet
```

or

Install via git clone

```bash
$ git clone https://github.com/fhqvst/nordnet.git
$ cd nordnet
$ npm install
```

## Documentation

The most important functions are `authenticate`, `call`, and `subscribe`.
- `authenticate`: Refer to the example below.
- `call`: See the [nExt API docs](https://api.test.nordnet.se/api-docs/index.html).
- `subscribe`: See the [nExt Feed docs](https://api.test.nordnet.se/next/2/api-docs/docs/feeds).

For anything else, refer to [API.md](https://github.com/fhqvst/nordnet/blob/master/API.md).

**NOTE: Do not use your Nordnet credentials. Instead, create a nExt API account [here](https://api.test.nordnet.se/account/register).**

## Examples
```javascript
import Nordnet from 'nordnet'
const nordnet = new Nordnet()

// See note above for which credentials to use.
nordnet.authenticate({
  username: 'gunther_marder',
  password: 'dinkelspiel123'
}).then(() => {

  // Listen for feed messages
  nordnet.on('private', data => console.log('Private feed:', data))
  nordnet.on('public', data => console.log('Public feed:', data)

  // Subscribe to trade events for Nordnet B (1869) on Burgundy market (30)
  nordnet.subscribe('trades', { i: '1869', m: 30 })
  
  // Fetch data about VOLV A
  nordnet.call('GET', 'instruments/16313163').then(console.log) 

})
```

## Tests

Run all tests

```bash
$ npm test
```
NOTE: No tests will run without an `.env` file. Refer to `.env.example` in order to create your own.

## RESPONSIBILITIES

The author of this software is not responsible for any indirect damages (foreseeable or unforeseeable), such as, if necessary, loss or alteration of or fraudulent access to data, accidental transmission of viruses or of any other harmful element, loss of profits or opportunities, the cost of replacement goods and services or the attitude and behavior of a third party.

## Changelog

The GitHub [releases](releases) page is used for changelog entries.

## License

[MIT](LICENSE)

axios: https://github.com/mzabriskie/axios/<br>
node-rsa: https://github.com/rzcoder/node-rsa/
