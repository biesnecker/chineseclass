export default class PromiseWorker {
  constructor(worker) {
    this.resolves = {};
    this.rejects = {};
    this.globalMessageId = 0;
    this.worker = worker;
    this.worker.addEventListener("message", (msg) => this._handleMessage(msg));
  }

  sendMessage(type, payload) {
    const id = this.globalMessageId++;
    const message = { id, type, payload };

    return new Promise((resolve, reject) => {
      this.resolves[id] = resolve;
      this.rejects[id] = reject;

      this.worker.postMessage(message);
    });
  }

  _handleMessage(message) {
    const { id, err, payload } = message.data;
    if (payload) {
      const resolve = this.resolves[id];
      resolve(payload);
    } else {
      const reject = this.rejects[id];
      if (err !== null) {
        reject(err);
      } else {
        reject(new Error("unknown error occurred"));
      }
    }
    delete this.resolves[id];
    delete this.rejects[id];
  }
}

const wrapHandlerFuction = async (id, callback, payload) => {
  try {
    const res = await callback(payload);
    if (Array.isArray(res)) {
      postMessage({ id, err: null, payload: res[0] }, res[1]);
    } else {
      postMessage({ id, err: null, payload: res });
    }
  } catch (err) {
    postMessage({ id, err, payload: null });
  }
};

export const makeWorkerFromHandlers = (handlers) => async (message) => {
  const { id, type, payload } = message.data;
  if (!(type in handlers)) {
    postMessage({
      id,
      err: new Error(`Unknown message type: ${type}`),
      payload: null,
    });
  } else {
    const h = handlers[type];
    await wrapHandlerFuction(id, h, payload);
  }
};
