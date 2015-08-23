var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
  target: 'http://www.j-archive.com/'
});

module.exports = function (req, res) {
  delete req.headers.referer;
  proxy.web(req, res);
}
