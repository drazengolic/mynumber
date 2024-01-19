importScripts("wasm_exec.js");

const go = new Go(); // Defined in wasm_exec.js
const WASM_URL = 'wasm.wasm';

var wasm;

if ('instantiateStreaming' in WebAssembly) {
  WebAssembly.instantiateStreaming(fetch(WASM_URL), go.importObject).then(function (obj) {
    wasm = obj.instance;
    go.run(wasm);
  })
} else {
  fetch(WASM_URL).then(resp =>
    resp.arrayBuffer()
  ).then(bytes =>
    WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
      wasm = obj.instance;
      go.run(wasm);
    })
  )
}

function insertText(text, at, length) {

   // Get the address of the writable memory.
   let addr = wasm.exports.getBuffer()
   let buffer = wasm.exports.memory.buffer

   let mem = new Uint8Array(buffer)
   let view = mem.subarray(addr + at, addr + at + length)

   for (let i = 0; i < text.length; i++) {
      view[i] = text.charCodeAt(i)
   }

   for (let i = text.length; i < length; i++) {
      view[i] = 20
   }

   // Return the address we started at.
   return addr + at
}

function readText(at, length) {
   let addr = wasm.exports.getBuffer()
   let memory = wasm.exports.memory
   let bytes = memory.buffer.slice(addr + at, addr + at + length)
   let chars = new Uint8Array(bytes)
   let text = String.fromCharCode(...chars)

   return text.trim()
}

self.addEventListener('message', function(e) {
  if (e.data[0] === 'solve') {
    let expr = e.data[1]
    insertText(expr, 0, expr.length)

    let len = wasm.exports.find(expr.length)
    let msg = readText(24, len)

    postMessage(['solve', msg])
  }
}, false)
