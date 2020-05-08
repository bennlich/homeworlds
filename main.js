import { SharedState } from './src/SharedState.js';
import config from './config.js';

let homeworldsState = new SharedState({ serverUrl: config.socketUrl });
homeworldsState.onChange(render);
homeworldsState.onRemove((key) => {
  viewState[key].remove();
  delete viewState[key];
  render();
});

// references to paper.js objects keyed by global id
let viewState = {};
let getItemId = (item) => {
  return Object.keys(viewState)[Object.values(viewState).indexOf(item)]
};
let pieceTypes = () => {
  return [
    'supply', 'star', 'ship'
  ];
};
let nextType = (type) => {
  let types = pieceTypes();
  return types[(types.indexOf(type) + 1) % 3];
}

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
  render();
}

function clearState() {
  Object.keys(homeworldsState.state).forEach((key) => homeworldsState.delete(key));
  viewState = {};
  paper.project.clear();
  render();
}

function render() {
  let state = homeworldsState.state;
  document.querySelector('.debug-state').innerHTML = JSON.stringify(state, null, 2);
  Object.keys(state).forEach((id) => {
    if (viewState[id]) {
      viewState[id].remove();
    }
    viewState[id] = getShape(state[id]);
  });
  paper.view.draw();
}

function getShape(newState) {
  let getRadius = (size) => {
    if (size === 'small') return 30;
    if (size === 'medium') return 40;
    if (size === 'large') return 50;
  };
  
  let shape;
  if (newState.type === 'supply') {
    shape = new paper.Path.RegularPolygon({
      center: new paper.Point(0, 0),
      sides: 3,
      radius: getRadius(newState.size),
      fillColor: newState.color
    });
  }
  if (newState.type === 'star') {
    shape = new paper.Path.Rectangle({
      center: new paper.Point(0, 0),
      size: 2 * getRadius(newState.size),
      fillColor: newState.color
    });
  }
  if (newState.type === 'ship') {
    shape = new paper.Path.RegularPolygon({
      center: new paper.Point(0, 0),
      sides: 3,
      radius: getRadius(newState.size),
      fillColor: newState.color
    });
    shape.rotate(45);
  }
  shape.position.x = newState.x;
  shape.position.y = newState.y;
  return shape;
}

let canvas = document.getElementById('myCanvas');
paper.setup(canvas);

let selectedItemId = null;
let wasDragging = false;
paper.view.onMouseDown = (event) => {
  let hit = paper.project.hitTest(event.point);
  if (!hit)
    return;
  selectedItemId = getItemId(hit.item);
}
paper.view.onMouseMove = (event) => {
  if (!selectedItemId)
    return;
  let item = viewState[selectedItemId];
  let { x, y } = item.position.add(event.delta);
  homeworldsState.update(selectedItemId, { x, y });
  wasDragging = true;
  render();
}
paper.view.onMouseUp = (event) => {
  selectedItemId = null;

  if (wasDragging) {
    // This was the end of a drag. Clear the wasDragging state and return.
    wasDragging = false;
    return;
  }

  // This was a click. Cycle to the next piece type.
  let hit = paper.project.hitTest(event.point);
  if (!hit)
    return;
  let itemId = getItemId(hit.item);
  let { type } = homeworldsState.get(itemId);
  homeworldsState.update(itemId, { type: nextType(type) });
  render();
}

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

window.clearState = clearState;
window.addSet = addSet;
