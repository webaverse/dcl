function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

const result = [];
let loaded = false;
const _bind = method => function() {
  const args = Array.from(arguments);
  console.log(method, args);
  if (!loaded) {
    result.push({
      method,
      args,
    });
  } else {
    console.warn('extra', {method, args}, new Error().stack);
    debugger;
  }
};
const loadPromises = [];
globalThis.dcl = {
  loadModule() {
    console.log('load module', Array.from(arguments));
    const p = Promise.resolve({
      methods: {
        getUserData() {
          console.log('run module getUserData');
          debugger;
        },
        /* callRpc() {
          console.log('run module callRpc');
          debugger;
        }, */
        getUserPublicKey() {
          console.log('run module getUserPublicKey');
          debugger;
        },
        getCurrentRealm() {
          console.log('run module getCurrentRealm');
          debugger;
        },
        getBootstrapData() {
          console.log('run module getBootstrapData');
          debugger;
        },
      },
    });
    loadPromises.push(p);
    return p;
  },
  callRpc() {
    return new Promise((accept, reject) => {
      // nothing
    });
  },
};
[
  'log',
  'addEntity',
  'removeEntity',
  'onUpdate',
  'onEvent',
  'subscribe',
  'onStart',
  'error',
  'attachEntityComponent',
  'setParent',
  'updateEntityComponent',
  'componentCreated',
  'componentUpdated',
].forEach(method => {
  dcl[method] = _bind(method);
});

(async () => {

const q = parseQuery(self.location.search);
const {hash} = q;

const res = await fetch('https://peer-ec1.decentraland.org/lambdas/contentv2/contents/' + hash);
const text = await res.text();
const timeoutQueue = [];
const {setTimeout} = globalThis;
globalThis.setTimeout = fn => {
  timeoutQueue.push(fn);
  /* try {
    fn();
  } catch(err) {
    console.warn(err);
  } */
};
globalThis.setInterval = fn => {
  timeoutQueue.push(fn);
  /* try {
    fn();
  } catch(err) {
    console.warn(err);
  } */
};
// console.log('run start 1', text);
eval(text);
// console.log('run start 2');
await Promise.all(loadPromises);
await new Promise((accept, reject) => { // wait for modules
  setTimeout(accept);
});
// console.log('run start 3');
['onStart', 'onUpdate'].forEach(m => {
  for (const entry of result) {
    const {method, args} = entry;
    if (method === m) {
      const [fn] = args;
      console.log('run', m, fn);
      fn();
    }
  }
});
for (const fn of timeoutQueue) {
  fn();
}
timeoutQueue.length = 0;
/* for (let i = 0; i < 10; i++) {
  for (const fn of timeoutQueue) {
    fn();
  }
  timeoutQueue.length = 0;
  ['onUpdate'].forEach(m => {
    for (const entry of result) {
      const {method, args} = entry;
      if (method === m) {
        const [fn] = args;
        console.log('run', m, fn);
        fn();
      }
    }
  });
} */

await new Promise((accept, reject) => {
  setTimeout(accept, 0);
});
loaded = true;

console.log('done');

self.postMessage(JSON.stringify({
  result,
}));

})();