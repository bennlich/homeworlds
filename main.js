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

let homeworldsState = new SharedState({ serverUrl: 'ws://localhost:8787' });
homeworldsState.onChange(render);
homeworldsState.onRemove((key) => {
  viewState[key].remove();
  delete viewState[key];
  render(homeworldsState.state);
});

let viewState = {};

function addSet() {
  let sizes = ['small', 'medium', 'large'];
  let colors = ['red', 'green', 'blue', 'yellow'];
  let nextId = Object.keys(homeworldsState.state).length > 0 ? _.max(Object.keys(homeworldsState.state).map((v) => parseInt(v))) + 1 : 1;
  console.log(nextId);
  for (let size of sizes) {
    for (let color of colors) {
      homeworldsState.set(nextId, {
        size,
        color,
        type: 'supply',
        x: Math.random()*paper.view.viewSize.width,
        y: Math.random()*paper.view.viewSize.height
      });
      nextId += 1;
    }
  }
  render(homeworldsState.state);
}

function clearState() {
  Object.keys(homeworldsState.state).forEach((key) => homeworldsState.delete(key));
  viewState = {};
  paper.project.clear();
  render(homeworldsState.state);
}

function render(state) {
  document.querySelector('.debug-state').innerHTML = JSON.stringify(state);
  Object.keys(state).forEach((id) => {
    let item = viewState[id];
    if (!item) {
      viewState[id] = createItem(id, state[id]);
    } else {
      viewState[id] = updateItem(viewState[id], state[id]);
    }
  });
  paper.view.draw();
}

function createItem(id, newState) {
  if (newState.type === 'supply') {
    let getRadius = (size) => {
      if (size === 'small') return 30;
      if (size === 'medium') return 40;
      if (size === 'large') return 50;
    };

    let piece = new paper.Path.RegularPolygon({
      center: new paper.Point(newState.x, newState.y),
      sides: 3,
      radius: getRadius(newState.size),
      fillColor: newState.color
    });

    piece.onMouseDrag = (event) => {
      piece.position = piece.position.add(event.delta);
      homeworldsState.set(id, _.extend(homeworldsState.state[id], { x: piece.position.x, y: piece.position.y }));
      paper.view.draw();
    }

    return piece;
  }
}

function updateItem(item, newState) {
  item.position.x = newState.x;
  item.position.y = newState.y;
  return item;
}

let canvas = document.getElementById('myCanvas');
paper.setup(canvas);

// Create a triangle shaped path 
// var triangle = new paper.Path.RegularPolygon({
//   center: new paper.Point(80, 70),
//   sides: 3,
//   radius: 50
// });
// triangle.fillColor = '#e9e9ff';

// triangle.onMouseDrag = function(event) {
//   triangle.position = triangle.position.add(event.delta);
//   homeworldsState.set(triangle.id, { x: triangle.position.x, y: triangle.position.y });
//   paper.view.draw();
// }

// var tool = new paper.Tool();
// var path;

// tool.onMouseDown = function(event) {
//   path = new paper.Path();
//   path.strokeColor = 'black';
//   path.add(event.point);
// }

// tool.onMouseDrag = function(event) {
//   path.add(event.point);
// }