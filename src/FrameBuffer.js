'use strict';

function FrameBuffer(onFrame) {
  let buffer = null;
  let frameLength = null;

  return (data) => {
    if (!buffer) {
      buffer = data;
    } else {
      buffer = Buffer.concat([buffer, data]);
    }

    if (!frameLength && buffer.length >= 4) {
      frameLength = buffer.readUInt32BE();
      buffer = buffer.slice(4);
    }

    while (frameLength && buffer.length >= frameLength) {
      const payload = buffer.slice(0, frameLength);
      buffer = buffer.slice(frameLength);

      process.nextTick(onFrame, payload);

      if (buffer.length >= 4) {
        frameLength = buffer.readUInt32BE();
        buffer = buffer.slice(4);
      } else {
        frameLength = null;
      }
    }
  };
}

module.exports = FrameBuffer;
