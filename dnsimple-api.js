/*
 * The DNSimple class provides a namespace for all other classes
 * used to interact with the DNSimple API.
 *
 * This library depends on jQuery 1.4.2 or higher.
 *
 * Please note that if you want to use dnsimple-api.js in a browser
 * then you should not include this file directly, rather you should
 * include dnsimple.js and call DNSimple.load().
 *
 * More information about the DNSimple REST API can be found at:
 * https://dnsimple.com/documentation/api
 */
DNSimple = {
  /*
   * Utility class that handles encoding and decoding Base64.
   */
  Util: {
    keyString: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    uTF8Encode: function(string) {
      string = string.replace(/\x0d\x0a/g, "\x0a");
      var output = "";
      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
          output += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          output += String.fromCharCode((c >> 6) | 192);
          output += String.fromCharCode((c & 63) | 128);
        } else {
          output += String.fromCharCode((c >> 12) | 224);
          output += String.fromCharCode(((c >> 6) & 63) | 128);
          output += String.fromCharCode((c & 63) | 128);
        }
      }
      return output;
    },
    uTF8Decode: function(input) {
      var string = "";
      var i = 0;
      var c = c1 = c2 = 0;
      while ( i < input.length ) {
        c = input.charCodeAt(i);
        if (c < 128) {
          string += String.fromCharCode(c);
          i++;
        } else if ((c > 191) && (c < 224)) {
          c2 = input.charCodeAt(i+1);
          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        } else {
          c2 = input.charCodeAt(i+1);
          c3 = input.charCodeAt(i+2);
          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }
      return string;
    },

    base64Encode: function(input) {
      var keyString = this.keyString;
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;
      input = this.uTF8Encode(input);
      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }
        output = output + keyString.charAt(enc1) + keyString.charAt(enc2) + keyString.charAt(enc3) + keyString.charAt(enc4);
      }
      return output;
    },
    base64Decode: function(input) {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      while (i < input.length) {
        enc1 = keyString.indexOf(input.charAt(i++));
        enc2 = keyString.indexOf(input.charAt(i++));
        enc3 = keyString.indexOf(input.charAt(i++));
        enc4 = keyString.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3);
        }
      }
      output = this.uTF8Decode(output);
      return output;
    }
  },

  /*
   * Set the credentials to use during API calls.
   */
  credentials: function(username, password) {
    this.username = username;
    this.password = password;
  },

  /*
   * The URL for the API endpoint.
   */
  url: 'https://dnsimple.com',

  /*
   * Headers to add to each AJAX request.
   */
  headers: function(xhr) {
    xhr.setRequestHeader("Authorization", "Basic " + DNSimple.Util.base64Encode(DNSimple.username + ":" + DNSimple.password));
  },

  /*
   * Wrapper for collections returned from the API to add
   * add some methods.
   */
  Resources: {
    /**
     * Find the first object in the collection that has the given
     * property with the given value.
     */
    find: function(key, value) {
      var found_resource = null;
      $.each(this, function(i, resource) {
        if (resource[key] == value) {
          found_resource = resource;
          return;
        }
      });
      return found_resource;
    }
  },

  /*
   * Representation of a DNSimple domain.
   */
  Domain: {
    /*
     * Methods that are added to the JSON returned from the server
     * that provide object functionality.
     */
    InstanceMethods: {
      /*
       * Retreive all of the records for this domain.
       *
       * @param callback A function that accepts the collection of
       * records that is returned.
       */
      records: function(callack) {
        DNSimple.Record.all(this, function(records) {
          $.extend(records, DNSimple.Resources);
          callack(records); 
        });
      },
      /*
       * Destroy the domain by removing it from the server.
       * When this method completes successfully it will set the
       * deleted property on the domain to true.
       */
      destroy: function() {
        $.ajax({
          url: DNSimple.url + '/domains/' + this.id + '.json',
          dataType: 'json',
          type: 'delete',
          success: function(res) {
            this.deleted = true;
            console.log("Deleted the domain from the server");
          },
          beforeSend: DNSimple.headers
        });
      }
    },

    /*
     * Get an array of all of the domains for the current credentials.
     *
     * @param callback A function that accepts a single argument which is
     * the collection of domains.
     */
    all: function(callback) {
      $.ajax({
        url: DNSimple.url + '/domains.json',
        dataType: 'json',
        type: 'get',
        success: function(res) {
          domains = new Array();
          $.each(res, function(i, r) {
            var domain = r['domain'];
            $.extend(domain, DNSimple.Domain.InstanceMethods);
            domains.push(domain);
            console.log("Loaded domains from the server");
          });
          callback(domains);
        },
        beforeSend: DNSimple.headers
      });
    },

    /*
     * Find a domain using the domain's id or name.
     *
     * @param id_or_name The domain id or name
     * @param callack A function that accepts the domain as its argument
     */
    find: function(id_or_name, callback) {
      $.ajax({ 
        url: DNSimple.url + '/domains/' + id_or_name + '.json', 
        dataType: 'json',
        type: 'get',
        success: function(res) {
          var domain = res['domain'];
          $.extend(domain, DNSimple.Domain.InstanceMethods);
          callback(domain);
          console.log("Loaded domain from the server");
        },
        beforeSend: DNSimple.headers
      });
    },

    create: function(attributes, callback) {
      $.ajax({
        url: DNSimple.url + '/domains.json',
        dataType: 'json',
        data: {'domain': attributes},
        type: 'post',
        success: function(res) {
          var domain = res['domain'];
          $.extend(domaijn, DNSimple.Domain.InstanceMethods);
          callback(domain);
          console.log("Created domain on server");
        },
        beforeSend: DNSimple.headers
      });
    }
  },

  Record: {
    InstanceMethods: {
      save: function() {
        if (this.deleted) {
          console.log("Cannot save, the record has been deleted.");
          return;
        }

        $.ajax({
          url: DNSimple.url + '/domains/' + this.domain.id + '/records/' + this.id + '.json',
          dataType: 'json',
          data: {'record': {'name': this.name, 'content': this.content}},
          type: 'put',
          success: function(res) {
            console.log("Saved the record to the server");
          },
          beforeSend: DNSimple.headers
        });
      },

      destroy: function() {
        $.ajax({
          url: DNSimple.url + '/domains/' + this.domain.id + '/records/' + this.id + '.json',
          dataType: 'json',
          type: 'delete',
          success: function(res) {
            this.deleted = true;
            console.log("Deleted the record from the server");
          },
          beforeSend: DNSimple.headers
        });
      }
    },

    all: function(domain, callback) {
      $.ajax({
        url: DNSimple.url + '/domains/' + domain.id + '/records.json',
        dataType: 'json',
        type: 'get',
        success: function(res) {
          objects = new Array();
          $.each(res, function(i, r) {
            var o = r['record'];
            $.extend(o, DNSimple.Record.InstanceMethods);
            o.domain = domain;
            objects.push(o);
          });
          callback(objects);
          console.log("Loaded records from the server");
        },
        beforeSend: DNSimple.headers
      });
    },

    find: function(domain, id, callback) {
      $.ajax({ 
        url: DNSimple.url + '/domains/' + domain.id + '/records/' + id + '.json', 
        dataType: 'json',
        type: 'get',
        success: function(res) {
          var o = res['record'];
          $.extend(o, DNSimple.Record.InstanceMethods);
          o.domain = domain;
          callback(o);
          console.log("Loaded record from the server");
        },
        beforeSend: DNSimple.headers
      });
    },

    create: function(domain, attributes, callback) {
      $.ajax({
        url: DNSimple.url + '/domains/' + domain.id + '/records.json',
        dataType: 'json',
        data: {'record': attributes},
        type: 'post',
        success: function(res) {
          var o = res['record'];
          $.extend(o, DNSimple.Record.InstanceMethods);
          o.domain = domain;
          callback(o);
          console.log("Created record on the server");
        },
        beforeSend: DNSimple.headers
      });
    }
  }
}

