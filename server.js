// Enable TLS for self-signed or unverified certs (optional but useful)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Load dependencies
const cors_proxy = require('./lib/cors-anywhere');
const parseEnvList = (env) => (env ? env.split(',') : []);

// Configuration
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;
const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
const checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// Start the proxy server
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [], // disables 'origin'/'x-requested-with' enforcement
  checkRateLimit: checkRateLimit,
  redirectSameOrigin: true,

  // Optional header stripping for stealth
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],

  // Allow proxying full URLs directly
  handleInitialRequest: function(req, res, location) {
    if (!/^https?:\/\//i.test(location)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid target URL. Please use full URL starting with http:// or https://');
      return true;
    }
    return false; // allow CORS proxy to process
  },

  httpProxyOptions: {
    xfwd: false, // avoid leaking proxy chain headers
    followRedirects: true,
  },
}).listen(port, host, () => {
  console.log(`✅ CORS Proxy running on http://${host}:${port}`);
});
