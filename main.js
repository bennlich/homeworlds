import { SharedState } from './src/SharedState.js';
import config from './config.js';

let homeworldsState = new SharedState({ serverUrl: config.socketUrl });
homeworldsState.onChange(render);
homeworldsState.onRemove((key) => {
  viewState[key].remove();
  delete viewState[key];
  render();
});

// TODO: Should this be a part of SharedState? Why is it so hard to work with objects? Arrays?
let nextKey = () => {
  if (Object.keys(homeworldsState.state).length === 0)
    return 1;
  return _.max(Object.keys(homeworldsState.state).map((v) => parseInt(v))) + 1;
};

// references to paper.js objects keyed by global id
let viewState = {};
let getItemId = (paperItem) => {
  return Object.keys(viewState)[Object.values(viewState).indexOf(paperItem)]
};
let nextType = (item) => {
  let numPlayers = getPlayerKeys().length;
  if (item.type === 'supply')
    return { type: 'star' };
  if (item.type === 'star' && numPlayers > 0)
    return { type: 'ship', playerKey: 0 };
  if (item.type === 'ship' && item.playerKey < (numPlayers - 1))
    return { type: 'ship', playerKey: item.playerKey + 1 };
  return { type: 'supply' };
};

function addPyramidsSet() {
  let sizes = ['small', 'medium', 'large'];
  let colors = ['red', 'green', 'blue', 'yellow'];
  for (let size of sizes) {
    for (let color of colors) {
      homeworldsState.set(nextKey(), {
        size,
        color,
        type: 'supply',
        x: Math.random()*paper.view.viewSize.width,
        y: Math.random()*paper.view.viewSize.height
      });
    }
  }
  render();
}

function getPlayerKeys() {
  return Object.values(homeworldsState.state)
    .filter((item) => item.type === 'player')
    .map((item) => homeworldsState.getKey(item));
}

function addPlayerCircle() {
  homeworldsState.set(nextKey(), {
    type: 'player',
    x: Math.random()*paper.view.viewSize.width,
    y: Math.random()*paper.view.viewSize.height
  });
  render();
}

function removePlayerCircle() {
  let playerKeys = getPlayerKeys();
  console.log(playerKeys);
  if (playerKeys.length > 0) {
    homeworldsState.delete(playerKeys[0]);
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
    let size = getRadius(newState.size);
    shape = new paper.Path({
      segments: [[-size/2, 0], [size/2, 0], [0, 1.5*size]],
      fillColor: newState.color
    });
    let player = homeworldsState.get(getPlayerKeys()[newState.playerKey]);
    if (player) {
      let angle = new paper.Point(player.x, player.y).subtract(paper.view.center).angle;
      shape.rotate(90 + angle);
    }
  }
  if (newState.type === 'player') {
    shape = new paper.Path.Circle({
      center: new paper.Point(0, 0),
      fillColor: 'orange',
      radius: 20
    });
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
  let item = homeworldsState.get(itemId);
  homeworldsState.update(itemId, nextType(item));
  render();
}

window.clearState = clearState;
window.addPyramidsSet = addPyramidsSet;
window.addPlayerCircle = addPlayerCircle;
window.removePlayerCircle = removePlayerCircle;