module.exports = function(RED) {
  var iconvLite = require('iconv-lite');
  var EncodingNode = function (config) {
    RED.nodes.createNode(this,config);
    var node = this;
    function isBuffer (obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    /**
     * Based on https://github.com/andris9/encoding/blob/master/lib/encoding.js
     * Converts charset name if needed
     *
     * @param {String} name Character set
     * @return {String} Character set name
     */
    function fixEncodingName(name) {
        return (name || '').toString().trim().
        replace(/^latin[\-_]?(\d+)$/i, 'ISO-8859-$1').
        replace(/^win(?:dows)?[\-_]?(\d+)$/i, 'WINDOWS-$1').
        replace(/^utf[\-_]?(\d+)$/i, 'UTF-$1').
        replace(/^ks_c_5601\-1987$/i, 'CP949').
        replace(/^us[\-_]?ascii$/i, 'ASCII').
        toUpperCase();
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
      var toCharset = fixEncodingName(config.destination || msg.destination || 'utf-8');
      var fromCharset = fixEncodingName(config.source || msg.source || 'utf-8');
      var buffered = isBuffer(text);
      try {
        if (fromCharset !== 'UTF-8' && !buffered) {
          text = new Buffer("" + (text || ""), 'binary');
        }
        if (fromCharset === 'UTF-8' && !buffered) {
          text = new Buffer("" + (text || ""), 'UTF-8');
        }
        // Encode
        text = iconvLite.encode(iconvLite.decode(text, fromCharset), toCharset);
        if(!buffered) {
          text = text.toString(toCharset === "UTF-8" ? toCharset : 'binary');
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
