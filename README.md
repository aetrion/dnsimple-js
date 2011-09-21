This project contains a simple example of how to import the DNSimple JavaScript library into a web
page.

The dnsimple.js file must be on your server and provides a loading mechanism to include the full
API script from the DNSimple site into your page.

To get started, add the following to the head of your HTML:

    <script type="text/javascript" src="dnsimple.js"></script>
    <script type="text/javascript">
      DNSimple.load();
    </script>

Please note that this project uses CORS (http://www.w3.org/TR/cors/) and thus requires a browser
that implements the CORS specification.

== Listing domains

  DNSimple.Domain.all(function(domains) { console.log(domains); });

The callback function will be passed a collection of domain objects.
