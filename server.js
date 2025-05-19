// Allow invalid TLS certificates (optional, useful for internal testing)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Required setup
const cors_proxy = require('./lib/cors-anywhere');
const parseEnvList = (env) => (env ? env.split(',') : []);

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
const checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// ✅ FINAL FIXED VERSION
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [], // ✅ Allow anonymous requests from browser or iframe
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Optional: 'x-forwarded-for', etc.
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
    followRedirects: true,
  },

  // ✅ (Optional) disable the built-in location check that causes "Invalid host"
  handleInitialRequest: function (req, res, location) {
    // Allow all valid URLs through
    if (!/^https?:\/\//i.test(location)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid target URL. Make sure it starts with http:// or https://');
      return true; // Block this request
    }
    return false; // Allow proxy to handle it
  },
}).listen(port, host, () => {
  console.log(`✅ CORS Anywhere is running at http://${host}:${port}`);
});
