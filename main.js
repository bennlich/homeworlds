import { SharedState } from './src/SharedState.js';
import config from './config.js';

let homeworldsState = new SharedState({ serverUrl: config.socketUrl });
homeworldsState.onChange(render);
homeworldsState.onRemove((key) => {
  viewState[key].remove();
  delete viewState[key];
  render();
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
  shape.position.x = newState.x;
  shape.position.y = newState.y;
  return shape;
}

let canvas = document.getElementById('myCanvas');
paper.setup(canvas);

let selectedItemId = null;
paper.view.onMouseDown = (event) => {
  let hit = paper.project.hitTest(event.point);
  if (!hit)
    return;
  selectedItemId = Object.keys(viewState)[Object.values(viewState).indexOf(hit.item)]
}
paper.view.onMouseMove = (event) => {
  if (!selectedItemId)
    return;
  let item = viewState[selectedItemId];
  let { x, y } = item.position.add(event.delta);
  homeworldsState.set(selectedItemId, _.extend(homeworldsState.state[selectedItemId], { x, y }));
  render();
}
paper.view.onMouseUp = (event) => {
  selectedItemId = null;
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
