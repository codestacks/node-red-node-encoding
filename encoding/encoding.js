module.exports = function(RED) {
    var encoding = require("encoding");
    var EncodingNode = function (config) {
        RED.nodes.createNode(this,config);
        var node = this;
        function isBuffer (obj) {
          return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
        }
        this.on('input', function (msg) {
          var toCharset = config.destination || msg.destination;
          var fromCharset = config.source || msg.source;
          var text = msg.payload;
          try {
            if(isBuffer(text)) {
              msg.payload = encoding.convert(text, toCharset, fromCharset);
            } else {
              msg.payload = encoding.convert(Buffer.from(text, fromCharset), toCharset, fromCharset).toString(toCharset);
            }
          } catch(e) {
            this.error("Can't convert from " + fromCharset + " to " + toCharset + ": " + e);
          }
          node.send(msg);
        });
    }
    RED.nodes.registerType("encoding", EncodingNode);
}
