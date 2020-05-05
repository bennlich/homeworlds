class SharedState {
  constructor({ serverUrl }) {
    this.state = {};
    this.changeCallbacks = [];
    this.removeCallbacks = [];

    this.socket = new WebSocket(serverUrl);
    this.socket.onopen = () => {
      console.log('socket open');
    };
    this.socket.onmessage = (e) => {
      let data = JSON.parse(e.data);
      if (data.type === 'init') {
        this.state = data.state;
        this.emitChange();
      }
      if (data.type === 'set') {
        this.state[data.key] = data.value;
        this.emitChange();
      }
      if (data.type === 'delete') {
        delete this.state[data.key];
        this.emitRemove(data.key);
      }
    };
  }
  onChange(fn) {
    this.changeCallbacks.push(fn);
  }
  emitChange() {
    this.changeCallbacks.forEach((fn) => fn(this.state));
  }
  onRemove(fn) {
    this.removeCallbacks.push(fn);
  }
  emitRemove(key) {
    this.removeCallbacks.forEach((fn) => fn(key));
  }
  set(key, value) {
    this.state[key] = value;
    this.socket.send(JSON.stringify({ type: 'set', key, value }));
  }
  delete(key) {
    delete this.state[key];
    this.socket.send(JSON.stringify({ type: 'delete', key }));
  }
}

export { SharedState };
