'use strict';

const fs = require('fs');
const path = require('path');
const Hapi = require('hapi');

(function () {
  const processAddendum = require('./app/index');
  const utils = require('./app/utils');

  const server = new Hapi.Server();
  server.connection({ port: process.env.PORT || 8080 });

  server.route({
    method: 'GET',
    path: '/',
    handler(req, reply) {
      reply('success get');
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
      const filePath = path.join(__dirname, `tmp/${utils.getGuid()}.pdf`);
      const writable = fs.createWriteStream(filePath);

      data.pipe(writable);

      data.on('end', (err) => {
        if (err) { reply(JSON.stringify(err)); }
        writable.end();
      });

      writable.on('error', (err) => {
        reply(JSON.stringify(err))
          .code(502);
      });

      writable.on('finish', (err) => {
        if (err) {
          reply(JSON.stringify(err))
            .code(502);
        }

        const file = new Uint8Array(fs.readFileSync(writable.path));

        processAddendum(file, (jsonData) => {
          reply(JSON.stringify({
            headers: data.headers,
            body: jsonData,
          }))
            .code(201);

          utils.rmDir('./tmp', false);
        });
      });
    },
  });

  server.start((err) => {
    if (err) { throw err; }
    console.log(`Server started at: ${server.info.uri}`);
  });
}());
