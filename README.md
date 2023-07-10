# Isorender

Add isomorphic rendering to any server, regardless of language.

## Isorender.Server

The Isorender NodeJS server.

### Examples

```javascript
const { Server } = require("isorender");

// You can use Isorender synchronously...
const server = Server((conn, data) => {
  return `Hello, ${data.name}! You went to ${conn.path}!`;
});

// ...or asynchronously.
const server = Server((conn, data, cb) => {
  setTimeout(() => {
    cb(null, `Hello, ${data.name}! You went to ${conn.path}!`);
  }, 2500);
});


// You can also override the default error handling function.
const server = Server((conn, data) => {
  throw new Error("This could be sensitive information!");
}, (e) => "But it's okay because this is what will be sent.");

// Isorender is best used with some sort of library/framework.
const server = Server((conn, data) => {
  return ReactDOMServer.renderToString(<App path={conn.path} data={data} />);
});

server.listen(8080, () => console.log("Listening on port 8080"));
```

### API

* `Server(renderFunc[, errorHandler])`
  Returns a Server that will render requests with `renderFunc`. `renderFunc` is
  called with `(conn, data[, cb])` and is optionally asynchronous (determined by
  `renderFunc.length`). `cb` accepts two parameters: `(err, markup)`, where
  `err` is any error occurred during the process and `markup` is the rendered
  markup. If `renderFunc` throws an error (if synchronous) or calls it's
  callback with an error, `errorHandler` will be called with `(err)` where `err`
  is the error thrown or called in the callback. If `errorHandler` is not
  provided in the constructor, it defaults to `(e) => e.toString()`.

* `server.listen(...args)`
  Applies arguments to the `net.Server.listen` function. Can accept any
  arguments `net.Server.listen` will accept.

* `server.close(...args)`
  Applies arguments to the `net.Server.close` function. Can accept any
  arguments `net.Server.close` will accept.

## Isorender.Client

A reference implementation of an Isorender client.

### Example

```javascript
const { Client } = require("isorender");

// Assuming a server has been started on localhost:8080
const client = Client("localhost:8080");

client.send({ path: "/test", host: "localhost", query: {} }, { name: "world" }, (err, response) => {
  assert(response.rendered === "Hello, world! You went to /test!");
});
```

### API

* `Client(url[, timeout])`
  Returns a Client that connects to `url`. The `timeout` parameter sets the
  amount of time the client will wait for a response before triggering a
  timeout. The Client queues requests, so you can immediately begin sending
  requests.

* `client.send(conn, data, cb)`
  Sends a request with the provided `conn` and `data`. On receiving
  a response, `cb` is called with the arguments `(err, response)`. `err` is
  used for any transport errors that may happen. If an error occurs inside the
  Isorender server's render function, then the `response` parameter will have
  an error property containing the error message.

* `client.close()`
  Closes the client.

## Protocol

The Isorender protocol consists of a length-prefixed JSON payload. The length
prefix is always a 32-bit unsigned integer in big endian. The JSON payload
should be encoded in `utf8`.

### Request

A request will be in the following format.
```json
{
  "id": random UUIDv4,
  "conn": {...},
  "data": {...}
}
```

`conn` is an arbitrary object provided by the client use for information about
the request, such as the host, path, query, headers, etc. 

`data` is also an arbitrary object provided by the client, however it should
consist of other information to be used by the rendering server. For example,
it could consist of data retrieved from your database.

### Response

A response can be in one of two formats.

```json
{
  "id": "UUIDv4 sent in the request",
  "rendered": "Rendered markup"
}
```

```json
{
  "id": "UUIDv4 sent in the request",
  "error": "Error string"
}
```

If the request was successfully rendered, the rendered markup will be in the
`rendered` key of the response. If it was not successful, a string representing
the error will be in the `error` key of the response. The `id` of the response
should be used to match with the `id` of the request to determine which request
the response is for. The Isorender server does not respond to requests in the
order they are received, so the responses could be out of order.
