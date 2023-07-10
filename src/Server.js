'use strict';

const net = require('net');
const FrameBuffer = require('./FrameBuffer');

function Server(renderFunc, handleError = (e) => e.toString()) {
  const server = net.createServer(handler);

  function handler(client) {
    const frameBuffer = FrameBuffer(onFrame);

    client.on('data', frameBuffer);

    function respond(obj) {
      const json = JSON.stringify(obj);
      const payload = Buffer.from(json, 'utf8');
      const length = Buffer.allocUnsafe(4);

      length.writeUInt32BE(payload.length);
      client.write(Buffer.concat([length, payload]));
    }

    function onFrame(payload) {
      const json = payload.toString('utf8');
      const request = JSON.parse(json);

      render((err, rendered) => {
        if (err) {
          return respond(error(request.id, err));
        }

        respond(response(request.id, rendered));
      }, request.conn, request.data);
    }
  }

  function listen(...args) {
    return server.listen(...args);
  }

  function close(...args) {
    return server.close(...args);
  }

  function error(id, error) {
    return { id, error: handleError(error) };
  }

  function response(id, rendered) {
    return { id, rendered };
  }

  function render(cb, ...args) {
    try {
      if (renderFunc.length === 2) {
        return process.nextTick(cb, null, renderFunc(...args));
      }

      process.nextTick(renderFunc, ...args, cb);
    } catch (e) {
      process.nextTick(cb, e);
    }
  }

  return { listen, close };
}

module.exports = Server;
