let http = require('http')
let fs = require('fs');
let path = require('path');
let { API, database } = require('./module/api/api.js');

database.create()

const ip = '127.0.0.1';
const port = 3000;

http.createServer(function(request, response){
  console.log('request, ', request.url);

  let file = '.' + request.url;
  if (file == './') file = './index.html';
  let extension = String(path.extname(file)).toLowerCase();
  let mime = { '.html': 'text/html',
    '.js':'text/javascript',
    '.css': 'text/css',
    '.json': 'application',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif'};

  let type = mime[extension] || 'application/octet-stream';

  fs.readFile(file, function(error, content){
    if (error) {
      if (error.code == 'ENOENT') {
        //Is this an API call, or should we serve a file?
        if (API.catchAPIrequest(request.url))
          API.exec(request, response);
        else
          // Not an API call - file doesn't exist
          fs.readFile('./404.html', function(error, content){
            response.writeHead(200,{'Content-Type': type});
            response.end(content, 'utf-8');
          });
      } else {
        response.writeHead(500);
        response.end('Error: ' + error.code + '\n');
        response.end();
      }
    } else {
      response.writeHead(200, {'content-Type': type});
      response.end(content, 'utf-8');
    }
  })
}).listen(port, ip);

console.log('Running at http://' + ip + ":" + port + "/");