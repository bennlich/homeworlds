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
  getKey(value) {
    for (let key in this.state) {
      if (this.state[key] === value) {
        return key;
      }
    }
  }
  get(key) {
    return this.state[key];
  }
  set(key, value) {
    this.state[key] = value;
    this.socket.send(JSON.stringify({ type: 'set', key, value }));
  }
  update(key, value) {
    for (let attrKey in value) {
      if (value.hasOwnProperty(attrKey)) {
        this.state[key][attrKey] = value[attrKey];
      }
    }
    this.socket.send(JSON.stringify({ type: 'set', key, value: this.state[key] }));
  }
  delete(key) {
    delete this.state[key];
    this.socket.send(JSON.stringify({ type: 'delete', key }));
    // Should this emit an event? Or are events only for remote changes?
    this.emitRemove(key);
  }
}

export { SharedState };
