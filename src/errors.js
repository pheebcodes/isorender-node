'use strict';

function makeError(name, defaultMessageOrTemplate) {
  const proto = Object.create(Error.prototype, {
    name: { value: name }
  });

  return (...m) => {
    const message = typeof defaultMessageOrTemplate === 'function' ?
      defaultMessageOrTemplate(...m) :
      m[0] || defaultMessageOrTemplate;
    const e = Object.create(proto, {
      message: { value: message }
    });
    
    Error.call(e);

    return e;
  };
}

module.exports.TimeoutError = makeError('TimeoutError', id => `Timeout on request ${id}`);
