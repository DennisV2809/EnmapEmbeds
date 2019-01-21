const EnmapEmbeds = require('./index');
const enmapEmbeds = new EnmapEmbeds();
enmapEmbeds.canLoad().then(c => {
  if(c) enmapEmbeds.load();
  else  enmapEmbeds.update();
})

const http = require('http');
http.createServer((request, response) => {
  const path = request.url.replace(/^\/|\/$/g, '').split('/');
  if(path[0] === 'enmap' && path[1]) {
    const embed = enmapEmbeds.find(path[1]);
    const data = embed ? { found: true, embed: embed } : { found: false };
    response.writeHead(200, { "Content-Type": "text/html" });
    response.write(JSON.stringify(data));
    return response.end();
  }

  response.writeHead(404);
  response.end();
}).listen(3000);

// With this small WebServer you can perform a GET request to http://localhost:3000/enmap/{query}
// The response will be an object with two keys: found and embed
// Example: GET http://localhost:3000/enmap/map
//
//{
//  "found": true,
//  "embed": {
//      "title": "Enmap.map",
//      "type": "rich",
//      "description": "Identical to [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).\n\n**Warning:** Depends on cache.",
//      "timestamp": null,
//      "color": 3447003,
//      "fields": [{
//          "name": "Params",
//          "value": "`fn` **function**\nFunction that produces an element of the new array, taking three arguments\n\n`[thisArg]` *****\nValue to use as `this` when executing function",
//          "inline": false
//      }, {
//          "name": "Returns",
//          "value": "`Array`",
//          "inline": false
//      }],
//      "thumbnail": null,
//      "image": null,
//      "author": {
//          "name": "Enmap Docs",
//          "url": "https://enmap.evie.codes/api",
//          "icon_url": "https://images-ext-1.discordapp.net/external/K8C97Vif-rsViQ7RXSCrzydUrFsxauKQ0DOhhf61xVI/%3Fgeneration%3D1529879273639085%26alt%3Dmedia/https/blobscdn.gitbook.com/v0/b/gitbook-28427.appspot.com/o/spaces%252F-LFnuGgkksxzZuqQoImA%252Favatar.png"
//      },
//      "footer": null
//  }
//}
