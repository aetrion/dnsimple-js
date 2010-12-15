DNSimple = {
  /*
   * Load the DNSimple library from the remote server.
   *
   * When the library is loaded the callback will be invoked.
   */
  load: function(url, callback) {
    if (typeof jQuery == 'undefined')
      throw("You must install JQuery to use the DNSimple JS API");

    if (url == null)
      url = 'https://dnsimple.com';
    
    var headID = document.getElementsByTagName("head")[0];         
    var dnsimpleScript = document.createElement('script');
    dnsimpleScript.type = 'text/javascript';
    dnsimpleScript.onload = function() {
      DNSimple.url = url;
      if (typeof callback == 'function')
        callback();
    };
    dnsimpleScript.src = url + '/javascripts/dnsimple-api.js';
    headID.appendChild(dnsimpleScript);
  }
}
