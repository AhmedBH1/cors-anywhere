var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
var cors_proxy = require('./lib/cors-anywhere');

// ✅ START THE SERVER
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [], // Allow anonymous usage
  checkRateLimit: checkRateLimit,
  redirectSameOrigin: true,
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Optional: uncomment to remove source IPs
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  setHeaders: function(headers) {
    // ✅ STRIP HEADERS THAT BREAK RENDERING
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    delete headers['access-control-allow-origin'];
    return headers;
  },
  httpProxyOptions: {
    xfwd: false,
    followRedirects: true,
  },
}).listen(port, host, function() {
  console.log('✅ Running CORS Anywhere on ' + host + ':' + port);
});
