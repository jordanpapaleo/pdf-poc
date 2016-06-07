'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server();

const goodOptions = {
  reporters: [{
    reporter: require('good-console'),
    events: { log: '*', response: '*' },
    // events: { log: ['error'], response: '*' }
  }],
};

// Generic Handler
function handler(request, reply) {
  // reply(error, data) error is optional
  // reply(new Error('agggg')) // Throws 500
  // reply(Boom.notFound()) // 404
  reply(request.params)
    .code(209)
    .type('text/json')
    .header('hello', 'world')
    .state('hello', 'world'); // Cookie
}

server.register({
  register: require('good'),
  options: goodOptions,
}, (err) => {
  console.log(err);

  server.connection({
    port: 8888,
  });

  server.route({
    method: ['POST'],
    path: '/v1/pdf',
    config: {
      payload: {
        output: 'stream',
        parse: false,
        allow: ['application/pdf'],
      },
    },
    handler(request, reply) {
      const data = request.payload;
      console.info(data);

      if (data.file) {
        const name = data.file.hapi.filename;
        console.info(name);
        reply(JSON.stringify({
          message: name,
        }))
          .code(200)
          .type('text/json');
      } else {
        reply(JSON.stringify({
          message: 'error',
        }))
          .code(543)
          .type('text/json');
      }
    },
  });

  server.start(() => {
    console.log(`Server started at: ${server.info.uri} `);
  });
});
