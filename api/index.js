const fs = require('fs');
const path = require('path');
const Hapi = require('hapi');
const processAddendum = require('../app/index');
const server = new Hapi.Server();
server.connection({ port: 8888 });

server.route({
  method: 'GET',
  path: '/',
  handler(req, reply) {
    reply('i am a beautiful butterfly');
  },
});

server.route({
  method: ['POST', 'PUT'],
  path: '/v1/pdf',
  config: {
    payload: {
      output: 'stream',
      parse: true,
      allow: ['application/pdf'],
    },
  },
  handler(request, reply) {
    const data = request.payload;
    const writable = fs.createWriteStream('file.pdf');

    data.pipe(writable);

    data.on('end', (err) => {
      if (err) { reply(JSON.stringify(err)); }
      writable.end();
    });

    writable.on('error', (err) => {
      console.error(err);
    });

    writable.on('finish', (err) => {
      if (err) { reply(JSON.stringify(err)); }

      const pdfPath = path.join(__dirname, writable.path);
      const file = new Uint8Array(fs.readFileSync(pdfPath));

      processAddendum(file, (jsonData) => {
        reply(JSON.stringify({
          headers: data.headers,
          body: jsonData,
        }))
        .code(201);
      });
    });
  },
});

server.start((err) => {
  if (err) { throw err; }
  console.log(`Server started at: ${server.info.uri}`);
});
