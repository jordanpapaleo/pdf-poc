const fs = require('fs');
const path = require('path');
const Hapi = require('hapi');
const doStuff = require('../app/index');
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
      output: 'stream', // 'file'
      parse: true,
      allow: ['application/pdf', 'multipart/form-data'],
    },
  },
  handler(request, reply) {
    const data = request.payload;

    /*console.info('-------------------------------');
    for (var key in data) {
      // console.log(key);
    }
    console.info('-------------------------------');*/

    const writable = fs.createWriteStream('file.pdf');
    writable.on('error', (err) => {
      console.error(err);
    });

    data.pipe(writable);

    data.on('end', (err) => {
      if (err) { reply(JSON.stringify(err)); }

      // YOU are HERE

      console.info('writable', writable)
      const pdfPath = path.join(__dirname, writable.path)
      const file = new Uint8Array(fs.readFileSync(pdfPath));
      // console.info('FILE', file)

      doStuff(file, (jsonData) => {
        reply(JSON.stringify({
          headers: data.headers,
          body: jsonData
        }));
      })
    });
  },
});

server.start((err) => {
  if (err) { throw err; }
  console.log(`Server started at: ${server.info.uri}`);
});
