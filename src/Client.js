'use strict';

const net = require('net');
const { v4: uuid } = require('uuid');
const FrameBuffer = require('./FrameBuffer');
const { TimeoutError } = require('./errors');

function Client(path, timeout = 5000) {
  const client = net.connect(path, onConnect);
  const requests = new Map(); 
  const frameBuffer = FrameBuffer(onFrame);
  let ready = false;
  let queue = null;

  client.on('data', frameBuffer);

  function onFrame(payload) {
    const json = payload.toString('utf8');
    const obj = JSON.parse(json);
    const cb = requests.get(obj.id);

    if (cb) {
      requests.delete(obj.id);
      process.nextTick(cb, null, obj);
    }
  }

  function onConnect() {
    if (queue) {
      client.write(queue);
      queue = null;
    }

    ready = true;
  }

  function startTimeout(id) {
    setTimeout(() => {
      const cb = requests.get(id);

      if (cb) {
        requests.delete(id);
        process.nextTick(cb, TimeoutError(id));
      }
    }, timeout);
  }

  function send(conn, data, cb) {
    const id = uuid();
    const request = { id, conn, data };
    const json = JSON.stringify(request);
    const payload = Buffer.from(json, 'utf8');
    const length = Buffer.allocUnsafe(4);

    length.writeUInt32BE(payload.length);
    requests.set(request.id, cb);

    if (!ready && queue) {
      queue = Buffer.concat([queue, length, payload]);
    } else if (!ready) {
      queue = Buffer.concat([length, payload]);
    } else {
      client.write(Buffer.concat([length, payload]));
    }

    startTimeout(request.id);

    return request;
  }

  function close() {
    return client.end();
  }

  return { send, close };
}

module.exports = Client;
