/* eslint-disable no-undef, no-unused-vars */

const canvasSize = 800; //how big in x and y pixels the canvas is
const gridSpace = 10; //how far apart in pixels each grid square is
const resolution = canvasSize / gridSpace; //how many grid squares we want to draw

const scene = {
  mirrorDistance: 8, //how far in units the mirrors are spaced
  midpointX: canvasSize / 2, //center of the stage
  mirror1X: null, //x cordinate the left mirror runs through vertically
  mirror2X: null, //x cordinate the right mirror runs through vertically
  mirror1: null, //reference to the mirror1 line
  mirror2: null, //reference to the mirror2 line
  observerSize: 40, //how big in X and Y pixels the object is
  objectSize: 40, //how big in X and Y pixels the object is
  observerYUnitsFromObject: 20,
  objectUnitsFromRightMirror: 3,
  objectGraphics: null,
  reflectionRightGraphics: null,
  reflectionLeftGraphics: null,
  numReflections: 4,
  dimensionWeight: 2,
  dimensionColor: 255,
  dimensionIncrementY: 40, //the Y distance in pixels each set of dimension lines is apart from the last
  dimensionTextSize: 20,
  dimensionAscenderY: 10 //how much each vertical dimension line rises or falls in pixels
};

let attachXStart, attachXEnd, attachY;
let dimYIndex = 1;
const dimensions = [];

function createGrid() {
  for (let i = 0; i < resolution * resolution; i++) {
    const row = Math.floor(i / resolution);
    const col = i % resolution;
    stroke(220);
    strokeWeight(1);
    fill(255);
    rect(row * gridSpace, col * gridSpace, gridSpace, gridSpace);
  }
}

function createMirrors() {
  scene.midpointX = canvasSize / 2;
  scene.mirror1X = scene.midpointX - (scene.mirrorDistance / 2) * gridSpace;
  scene.mirror2X = scene.midpointX + (scene.mirrorDistance / 2) * gridSpace;
  stroke(97, 157, 248);
  strokeWeight(2);
  scene.mirror1 = line(scene.mirror1X, 0, scene.mirror1X, canvasSize);
  scene.mirror2 = line(scene.mirror2X, 0, scene.mirror2X, canvasSize);
}

function createObserver() {
  const observer = createGraphics(scene.observerSize, scene.observerSize);

  observer.noStroke();
  observer.fill(65, 121, 106);
  observer.circle(
    scene.observerSize / 2,
    scene.observerSize / 2,
    scene.observerSize - 4
  );
  observer.noStroke();
  observer.fill(255);

  observer.circle(
    scene.observerSize / 2,
    scene.observerSize / 2 - scene.observerSize / 4,
    scene.observerSize / 4
  );

  image(
    observer,
    canvasSize / 2 - scene.observerSize / 2,
    canvasSize / 2 + scene.observerYUnitsFromObject * gridSpace
  );
}

function addObject() {
  image(
    scene.objectGraphics,
    scene.mirror2X -
      scene.objectSize / 2 -
      scene.objectUnitsFromRightMirror * gridSpace,
    canvasSize / 2 - scene.objectSize / 2
  );
}

function addObjectReflections() {
  let curReflection = 0;
  //say mirrorDist = 15 and scene.objectUnitsFromRightMirror = 5;
  let rPrev = -(scene.mirrorDistance - scene.objectUnitsFromRightMirror);
  let lPrev = -scene.objectUnitsFromRightMirror;

  for (let i = 0; i < scene.numReflections; i++) {
    const isRight = i % 2 === 0;
    const graphics = isRight
      ? scene.reflectionRightGraphics
      : scene.reflectionLeftGraphics;
    const reflectUnits = isRight ? rPrev : lPrev;
    const totalUnits = reflectUnits + scene.mirrorDistance;
    // TODO remove log
    // console.log(
    //   "totalUnits",
    //   totalUnits,
    //   "reflect units",
    //   reflectUnits,
    //   "i",
    //   i,
    //   "isRight",
    //   isRight
    // );
    const mirrorX = isRight ? scene.mirror2X : scene.mirror1X;
    let reflectX;
    if (isRight) {
      reflectX = mirrorX + totalUnits * gridSpace;
    } else {
      reflectX = mirrorX - totalUnits * gridSpace;
    }

    imageMode(CENTER);

    image(graphics, reflectX, canvasSize / 2);
    if (isRight && i > 0) {
      lPrev = totalUnits;
    } else {
      rPrev = totalUnits;
    }

    const dimYIncrementer = dimYIndex + Math.floor(i / 2);

    dimensions.push({
      attachXStart: isRight ? scene.mirror2X : reflectX,
      attachXEnd: isRight ? reflectX : scene.mirror1X,
      attachY: attachY - scene.dimensionIncrementY * dimYIncrementer
    });
  }
  drawDimensions();
}

function createObjectGraphics(objectType = "objectGraphics") {
  let objectFill = [218, 59, 95];
  if (objectType === "reflectionRightGraphics") {
    objectFill = [218, 59, 95, 180];
  } else if (objectType === "reflectionLeftGraphics") {
    objectFill = [248, 219, 96];
  }
  const object = createGraphics(scene.objectSize, scene.objectSize);
  object.noStroke();
  object.fill(objectFill);
  object.triangle(
    scene.objectSize,
    scene.objectSize,
    0,
    scene.objectSize,
    scene.objectSize / 2,
    0
  );

  object.fill(255);
  object.circle(
    scene.objectSize / 2,
    scene.objectSize / 2,
    scene.objectSize / 4
  );
  scene[objectType] = object;
}

function addDimensions() {
  attachY = canvasSize / 2;

  const observerX =
    scene.mirror2X - scene.objectUnitsFromRightMirror * gridSpace;

  dimensions.push(
    {
      attachXStart: observerX,
      attachXEnd: scene.mirror2X,
      attachY: attachY - scene.dimensionIncrementY * dimYIndex
    },
    {
      attachXStart: scene.mirror1X,
      attachXEnd: observerX,
      attachY: attachY - scene.dimensionIncrementY * dimYIndex
    }
  );

  dimYIndex++;

  dimensions.push({
    attachXStart: scene.mirror1X,
    attachXEnd: scene.mirror2X,
    attachY: attachY - scene.dimensionIncrementY * dimYIndex
  });

  dimYIndex++;
  //drawDimensions();
}

function drawDimensions() {
  stroke(121);
  strokeWeight(2);

  dimensions.forEach((dimension, i) => {
    stroke(0);
    line(
      dimension.attachXStart,
      dimension.attachY,
      dimension.attachXEnd,
      dimension.attachY
    );

    line(
      dimension.attachXStart,
      dimension.attachY + scene.dimensionAscenderY,
      dimension.attachXStart,
      dimension.attachY - scene.dimensionAscenderY
    );

    line(
      dimension.attachXEnd,
      dimension.attachY + scene.dimensionAscenderY,
      dimension.attachXEnd,
      dimension.attachY - scene.dimensionAscenderY
    );

    textAlign(CENTER, BOTTOM);

    const attachDistance = Math.abs(
      dimension.attachXStart - dimension.attachXEnd
    );
    const attachUnits = attachDistance / gridSpace;

    fill(0);
    stroke(255);
    textSize(scene.dimensionTextSize);

    text(
      attachUnits,
      dimension.attachXStart + attachDistance / 2,
      dimension.attachY
    );
  });
}

function setup() {
  createCanvas(canvasSize, canvasSize);
  createGrid();
  createMirrors();
  createObserver();
  createObjectGraphics("objectGraphics");
  createObjectGraphics("reflectionRightGraphics");
  createObjectGraphics("reflectionLeftGraphics");
  addObject();
  addDimensions();
  addObjectReflections();
}

function draw() {}