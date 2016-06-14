import fs from'fs';
import path from'path';

import utils from './utils';
import { processAddendum, processForImages } from './app';

export default [
  {
    method: 'GET',
    path: '/',
    handler(req, reply) {
      reply(null, 'success get');
      // reply(null, fs.createReadStream(__filename))
    }
  },
  {
    method: 'GET',
    path: '/error',
    handler() {
      throw new Error(Boom.notFound());
      reply(Boom.notFound())
    }
  },
  {
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
      reply(null, request.payload);
    }
  },
  {
    method: ['POST', 'PUT'],
    path: '/pdf',
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
    }
  },
  {
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
  }
]
