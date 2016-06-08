'use strict';

const fs = require('fs');
const path = require('path');
const Hapi = require('hapi');

(function () {
  const app = require('./app/index');
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
        maxBytes: 5000000,
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

        app.processAddendum(file, (jsonData) => {
          reply(JSON.stringify({
            headers: data.headers,
            body: jsonData,
          }))
            .code(201);

          utils.rmFile(writable.path);
        });
      });
    },
  });

  server.route({
    method: ['POST', 'PUT'],
    path: '/v1/pdf-img',
    config: {
      payload: {
        output: 'stream',
        parse: false,
        allow: ['application/pdf'],
        maxBytes: 5000000,
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
        } else {
          const file = new Uint8Array(fs.readFileSync(writable.path));

          app.processForImages(file, (jsonData) => {
            // console.info(jsonData);
            reply('yo').code(201);

            utils.rmFile(writable.path);
          });
        }
      });
    },
  });

  server.start((err) => {
    if (err) { throw err; }
    console.log(`Server started at: ${server.info.uri}`);
  });
}());
