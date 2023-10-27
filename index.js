require('dotenv').config()
const path = require('path')
const routes = require('./src/routes')

const lti = require('ltijs').Provider

const Database = require('ltijs-sequelize')

// Setup ltijs-sequelize using the same arguments as Sequelize's generic contructor
const db = new Database(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, 
  { 
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false 
  })

// Setup
lti.setup(process.env.LTI_KEY,
  { 
    plugin: db // Passing db object to plugin field
  },
  // {
  //   url: 'mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME + '?authSource=admin',
  //   connection: { user: process.env.DB_USER, pass: process.env.DB_PASS }
  // },
  {
    staticPath: path.join(__dirname, './public'), // Path to static files
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: '' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: true, // Set DevMode to true if the testing platform is in a different domain and https is not being used
    dynRegRoute: '/register', // Setting up dynamic registration route. Defaults to '/register'
    dynReg: {
      url: 'http://localhost:3000', // Tool Provider URL. Required field.
      name: 'Tool Provider', // Tool Provider name. Required field.
      logo: 'http://localhost:3000/logo512.png', // Tool Provider logo URL.
      description: 'Tool Description', // Tool Provider description.
      redirectUris: ['http://localhost:3000/launch'], // Additional redirection URLs. The main URL is added by default.
      customParameters: { key: 'value' }, // Custom parameters.
      autoActivate: true // Whether or not dynamically registered Platforms should be automatically activated. Defaults to false.
    }
  })

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res) => {
  return res.sendFile(path.join(__dirname, './public/index.html'))
})

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  return lti.redirect(res, '/deeplink', { newResource: true })
})

// Setting up routes
lti.app.use(routes)

// Setup function
const setup = async () => {
  await lti.deploy({ port: process.env.PORT })

  /**
   * Register platform
   */
  /* await lti.registerPlatform({
    url: 'http://localhost/moodle',
    name: 'Platform',
    clientId: 'CLIENTID',
    authenticationEndpoint: 'http://localhost/moodle/mod/lti/auth.php',
    accesstokenEndpoint: 'http://localhost/moodle/mod/lti/token.php',
    authConfig: { method: 'JWK_SET', key: 'http://localhost/moodle/mod/lti/certs.php' }
  }) */

  await lti.registerPlatform({
    url: "https://canvas.instructure.com",
    name: "curriki",
    clientId: "208830000000000128",
    authenticationEndpoint: "https://curriki.instructure.com/api/lti/authorize_redirect",
    accesstokenEndpoint: "https://curriki.instructure.com/login/oauth2/token",
    authConfig: {
      method: "JWK_SET",
      key: "https://curriki.instructure.com/api/lti/security/jwks",
    },
  });
}

setup()
