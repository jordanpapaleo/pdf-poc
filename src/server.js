import fs from'fs';
import path from'path';
import Hapi from'hapi';
import { processAddendum, processForImages } from './app';
import utils from './utils';
import raygun from 'raygun';

const raygunClient = new raygun.Client().init({ apiKey: '2aqTRCoqwJvVjPYx++ZO8A==' });
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
  method: 'GET',
  path: '/error',
  handler() {
    throw new Error('Were not so hapi now!');
  }
});

server.route({
  method: ['POST', 'PUT'],
  path: '/',
  config: {
    payload: {
      output: 'data',
      parse: true,
      allow: 'application/json'
    },
  },
  handler(request, reply) {
    reply(request.payload);
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
    }
  },
  handler(request, reply) {
    const data = request.payload;
    const filePath = path.join(__dirname, `tmp/${utils.getGuid()}.pdf`);
    const writable = fs.createWriteStream(filePath);

    data.pipe(writable);

    data.on('end', (err) => {
      if (err) {
        reply(JSON.stringify(err))
          .code(502);
      }

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

      processAddendum(file, (results) => {
        reply(JSON.stringify({
          headers: data.headers,
          body: results,
        })).code(201);

        utils.rmFile(writable.path);
      });
    });
  },
});

// Under construction
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

    reply({
      body: 'Under Construction',
    }).code(321);

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

        processForImages(file, (results) => {
          reply({
            body: results,
          }).code(201);

          utils.rmFile(writable.path);
        });
      }
    });
  },
});

server.on('request-error', (req, err) => {
  raygunClient.send(err, {}, () => {
    console.log('Send to Raygun');
    throw err;
  }, req);
});

server.start((err) => {
  if (err) { throw err; }
  console.log(`Server started at: ${server.info.uri}`);
});
