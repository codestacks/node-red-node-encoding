module.exports = function(RED) {
    var encoding = require("encoding");
    var EncodingNode = function (config) {
        RED.nodes.createNode(this,config);
        var node = this;
        function isBuffer (obj) {
          return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
        }

        this.field = config.field || "payload";
        this.fieldType = config.fieldType || "msg";

        this.on('input', function (msg) {
          // Read property
          var text = "";
          if (node.fieldType === 'msg' && msg) {
            text = RED.util.getMessageProperty(msg, node.field);
          } else if (node.fieldType === 'flow' && node) {
            text = node.context().flow.get(node.field);
          } else if (node.fieldType === 'global' && node) {
            text = node.context().global.get(node.field);
          }
          var toCharset = config.destination || msg.destination;
          var fromCharset = config.source || msg.source;
          try {
            // Encode
            if(isBuffer(text)) {
              text = encoding.convert(text, toCharset, fromCharset);
            } else {
              text = encoding.convert(Buffer.from(text + "", fromCharset), toCharset, fromCharset).toString(toCharset);
            }
            // Save to msg, flow or global
            if (node.fieldType === 'msg' && msg) {
              RED.util.setMessageProperty(msg, node.field, text);
            } else if (node.fieldType === 'flow' && node) {
              node.context().flow.set(node.field, text);
            } else if (node.fieldType === 'global' && node) {
              node.context().global.set(node.field, text);
            }
          } catch(e) {
            this.error("Can't convert from " + fromCharset + " to " + toCharset + ": " + e);
          }
          node.send(msg);
        });
    }
    RED.nodes.registerType("encoding", EncodingNode);
}
