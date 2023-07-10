'use strict';

const crypto = require('crypto');
const { promisify } = require('util');
const { Client, Server } = require('../src');
const FrameBuffer = require('../src/FrameBuffer');

const randomBytes = promisify(crypto.randomBytes);

function times(fn, n) {
  const ret = [];
  for (let i = 0; i < n; i++) {
    ret.push(fn(i));
  }
  return ret;
}

describe('FrameBuffer', () => {
  test('buffers length-prefixed frames appropriately', async () => {
    const frameSize = 256;
    const frameAmount = frameSize / 4;

    expect.assertions(frameAmount + 1);

    const frames = await Promise.all(times(async () => {
      return await randomBytes(frameSize);
    }, frameAmount));

    let data = Buffer.concat(frames.map(frame => {
      const size = Buffer.allocUnsafe(4);
      size.writeUInt32BE(frameSize, 0);
      return Buffer.concat([size, frame]);
    }));

    const receivedFrames = [];

    let i = 0;
    const frameBuffer = FrameBuffer(frame => {
      expect(frame).toEqual(frames[i++]);
      receivedFrames.push(frame)
    });

    while (data.length > 0) {
      const size = data.length > frameSize ? frameSize : data.length;
      frameBuffer(data.slice(0, size));
      data = data.slice(size);
    }

    return new Promise(resolve => {
      process.nextTick(() => {
        expect(receivedFrames).toEqual(frames);
        resolve();
      });
    });
  });
});
