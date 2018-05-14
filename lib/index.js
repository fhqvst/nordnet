const axios = require('axios')
const NodeRSA = require('node-rsa')
const path = require('path')
const EventEmitter = require('events')
const tls = require('tls')

const LIVE_API_URL = 'https://api.nordnet.se/next/2/'
const TEST_API_URL = 'https://api.test.nordnet.se/next/2/'
const PUBLIC_FEED = 'public'
const PRIVATE_FEED = 'private'
const SERVICE = 'NEXTAPI'

/**
 * A simple-to-use Node.js wrapper around the Nordnet nExt API.
 *
 * @extends EventEmitter
 */
class Nordnet extends EventEmitter {

  /**
   * Create a new client.
   *
   * @param {Object} config Description
   * @param {string} config.sessionKey Add a custom sessionKey.
   * @param {number} config.shortenExpires Milliseconds before session expiration to reauthenticate.
   * @param {Object} config.axiosConfig Custom settings for axios.
   *
   * @returns {Nordnet} A new Nordnet client.
   */
  constructor(config) {
    super()

    config = Object.assign({
      sessionKey: null,
      shortenExpires: 1000,
      axiosConfig: {}
    }, config)

    this.api = axios.create(Object.assign({
      baseURL: config.test === false ? LIVE_API_URL : TEST_API_URL,
      timeout: 10000,
      headers: {
        Accept: 'application/json'
      },
      mode: 'no-cors'
    }, config.axiosConfig))

    this.feed = {}
    this.feed[PUBLIC_FEED] = null
    this.feed[PRIVATE_FEED] = null

    this.sessionKey = config.sessionKey
    this.shortenExpires = config.shortenExpires
  }

  /**
   * Call one of the API endpoints.
   *
   * @param {string} method HTTP method to use when calling.
   * @param {string} endpoint The endpoint to call.
   * @param {Object} data JSON data to send with the request.
   *
   * @returns {Object|boolean} Returns an object upon success or error, or a simple
   *                           boolean false if this method is called
   *                           without the client being authenticated.
   */
  call(method, endpoint, data) {
    return new Promise((resolve, reject) => {
      if (!this.sessionKey) {
        reject(new Error('Make sure that the client is authenticated before using the API.'))
        return
      }
      this.api.request({
        method,
        url: endpoint,
        data
      })
        .then((response) => resolve(response.data))
        .catch(reject.bind(this))
    })
  }

  /**
   * Authenticate the client and receive a session key. The function also keeps
   * track of when the session key expires and reauthenticates automatically
   * just before it does.
   *
   * @param {Object} credentials Nordnet nExt API credentials.
   * @param {string} credentials.username Nordnet nExt API username
   * @param {string} credentials.password Nordnet nExt API password
   *
   * @returns {boolean} True if the authentication went OK, false otherwise.
   */
  authenticate(credentials) {
    return new Promise((resolve, reject) => {
      const { username, password } = credentials
      const hash = Nordnet.encryptLogin(username, password, path.join(__dirname, '..', 'NEXTAPI_TEST_public.pem'))

      this.api.post('login', {
        service: SERVICE,
        auth: hash.toString('base64')
      }).then((response) => {
        this.sessionKey = response.data.session_key

        const feedAuth = {}
        feedAuth[PUBLIC_FEED] = {
          host: response.data.public_feed.hostname,
          port: response.data.public_feed.port
        }
        feedAuth[PRIVATE_FEED] = {
          host: response.data.private_feed.hostname,
          port: response.data.private_feed.port
        }
        feedAuth.sessionKey = this.sessionKey
        this.authenticateFeeds(feedAuth)

        const basicAuth = Nordnet.base64(`${this.sessionKey}:${this.sessionKey}`)
        this.api.defaults.headers.common.Authorization = `Basic ${basicAuth}`

        const expiresIn = response.data.expires_in * 1000
        const reauthenticateIn = expiresIn - this.shortenExpires
        setTimeout(() => this.authenticate({ username, password }), reauthenticateIn)

        resolve(true)
      }).catch((e) => {
        reject(e)
        this.sessionKey = null
      })
    })
  }

  /**
   * Subscribe the public feed to a specific type of events.
   *
   * @param {string} type The type of events to start listening to.
   * @param {Object} args Arguments to pass together with the subscription command.
   *
   * @returns {Promise} Resolves when the feed is subscribed.
   */
  subscribe(type, args) {
    return new Promise(resolve => {
      this.feed[PUBLIC_FEED].write(
        Nordnet.formatFeedCommand('subscribe', Object.assign(args, { t: type })),
        resolve
      )
    })
  }

  /**
   * Authenticate all feeds and start listening for input.
   *
   * @param {Object} config The configuration object for all feeds.
   * @param {Object} config.FEED_HANDLE Configurations for the feed.
   * @param {string} config.FEED_HANDLE.host Host address for the feed.
   * @param {string} config.FEED_HANDLE.port Port for the feed.
   *
   * @returns {Promise} Resolves all authenticated feeds.
   */
  authenticateFeeds(config) {
    return Promise.all([
      this.authenticateFeed(PUBLIC_FEED, config[PUBLIC_FEED], config.sessionKey),
      this.authenticateFeed(PRIVATE_FEED, config[PRIVATE_FEED], config.sessionKey)
    ])
  }

  /**
   * Authenticate a single feed.
   *
   * @param {string} FEED_HANDLE
   * @param {Object} config Configuration for this feed.
   * @param {string} config.host Host address for the feed.
   * @param {string} config.port Port for the feed.
   * @param {string} sessionKey The session key received at login.
   *
   * @returns {Promise} Description
   */
  authenticateFeed(FEED_HANDLE, config, sessionKey) {
    const that = this
    return new Promise(resolve => {
      that.feed[FEED_HANDLE] = tls.connect(config.port, config.host, () => {
        that.feed[FEED_HANDLE].write(Nordnet.formatFeedCommand('login', {
          session_key: sessionKey,
          service: SERVICE
        }), () => {
          that.feed[FEED_HANDLE].on('data', data => {
              that.emit(FEED_HANDLE, JSON.parse(data.toString()))
          })
          resolve();
        })
      })
    })
  }

  /**
   * Convert a value to base64.
   *
   * @static
   * @param {string|number} value Value to encode to base64.
   *
   * @returns {string} A base64 encoded version of the value.
   */
  static base64(value) {
    return Buffer.from(value.toString()).toString('base64')
  }

  /**
   * Builder to be used when sending commands to the sockets.
   *
   * @static
   * @param {string} cmd  A valid feed command. One of `login`, `subscribe` or `unsibscribe`.
   * @param {Object} args Arguments to pass conjointly with the command.
   *
   * @returns {string} A stringified verson of the data, with a line break at the end.
   */
  static formatFeedCommand(cmd, args) {
    return `${JSON.stringify({ cmd, args })}\n`
  }

  /**
   * Base64 encodes the username, password and a timestamp, joins the
   * strings with colons, encrypts the joined string using Nordnet's
   * public RSA key, and finally base64 encodes the encrypted string. Phew.
   *
   * @static
   * @param {string} username Your Nordnet nExt username.
   * @param {string} password Your Nordnet nExt password.
   *
   * @returns {string} The encrypted, base64 encoded authentication string.
   */
  static encryptLogin(username, password) {
    /* note that nordnetPublicKey is provided by rollup */
    const rsa = new NodeRSA(nordnetPublicKey, { encryptionScheme: 'pkcs1' })

    if (!rsa) {
      throw new Error('Expected nordnetPublicKey to be a valid key.')
    }
    const b64username = Nordnet.base64(username)
    const b64password = Nordnet.base64(password)
    const b64timestamp = Nordnet.base64(Date.now())
    const auth = [b64username, b64password, b64timestamp].join(':')
    return rsa.encrypt(auth)
  }

}

module.exports = Nordnet
