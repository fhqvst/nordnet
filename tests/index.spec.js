import test from 'ava'
import dotenv from 'dotenv'
import path from 'path'

import Nordnet from 'index'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const nordnet = new Nordnet()

test.before(async () => {
  await nordnet.authenticate({
    username: process.env.NORDNET_USERNAME,
    password: process.env.NORDNET_PASSWORD
  })
})

test.serial('login', async t => {
  await nordnet.authenticate({
    username: process.env.NORDNET_USERNAME,
    password: process.env.NORDNET_PASSWORD
  })
  t.not(nordnet.sessionKey, null)
  t.is(typeof nordnet.sessionKey, 'string')
})

test('accounts', async t => {
  const response = await nordnet.call('GET', 'accounts')
  t.true(response instanceof Array)
})

test('search for instruments', async t => {
  const response = await nordnet.call('GET', 'instruments', {
    query: 'VOLVO'
  })
  t.true(response instanceof Array)
})

test('single instrument', async t => {
  const instrumentId = 16313163 // VOLV A
  const response = await nordnet.call('GET', `instruments/${instrumentId}`)
  t.true(response instanceof Array)
})

test.cb('public feeds', t => {
  nordnet.on('public', () => t.end())
})

test.cb('private feeds', t => {
  nordnet.on('private', () => t.end())
})
