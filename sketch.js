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
  observerFill: [65, 121, 106],
  objectSize: 40, //how big in X and Y pixels the object is
  observerYUnitsFromObject: 20,
  objectUnitsFromRightMirror: 3,
  objectGraphics: null,
  reflectionRightGraphics: null,
  reflectionRightFill: [218, 59, 95, 180],
  reflectionLeftGraphics: null,
  reflectionLeftFill: [248, 219, 96],
  numReflections: 2,
  dimensionWeight: 2,
  dimensionColor: 255,
  dimensionIncrementY: 40, //the Y distance in pixels each set of dimension lines is apart from the last
  dimensionTextSize: 20,
  dimensionAscenderY: 10, //how much each vertical dimension line rises or falls in pixels
  pivotFill: [65, 121, 106],
  pivotWeight: 10,
  animationIncrement: 10,
};

let dimYIndex = 1; //keeps track of the current set of dimensions to ensure they are spaced out evenly vertically
const dimensions = []; //holds all of the data to draw dimensions

let pivot; //holds the data to draw a pivoting line
let needsUpdate = true;
let pivotLength, pivotStartX, pivotEndX, pivotStartY, pivotEndY, finalX;
let curPivotLength = 0;
let pivotDrawStage = -1;

let curStartLineLength = 0;
let curReflectLineLength = 0;
let finalReflectLineLength = 0;

let drawGrid = true;

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
  imageMode(CORNER);
  image(
    observer,
    canvasSize / 2 - scene.observerSize / 2,
    canvasSize / 2 + scene.observerYUnitsFromObject * gridSpace
  );
}

function addObject() {
  imageMode(CORNER);
  image(
    scene.objectGraphics,
    scene.mirror2X -
      scene.objectSize / 2 -
      scene.objectUnitsFromRightMirror * gridSpace,
    canvasSize / 2 - scene.objectSize / 2
  );
}

function addObjectReflections() {
  let rPrev = -(scene.mirrorDistance - scene.objectUnitsFromRightMirror);
  let lPrev = -scene.objectUnitsFromRightMirror;

  let reflectRPrev, reflectLPrev;

  for (let i = 0; i < scene.numReflections; i++) {
    //loop through i sets of reflections
    const totalUnitsRight = rPrev + scene.mirrorDistance;
    const totalUnitsLeft = lPrev + scene.mirrorDistance;

    //console.log(totalUnitsRight, totalUnitsLeft, rPrev, lPrev, i);

    const reflectXRight = scene.mirror2X + totalUnitsRight * gridSpace;
    const reflectXLeft = scene.mirror1X - totalUnitsLeft * gridSpace;

    imageMode(CENTER);

    //right image
    image(scene.reflectionRightGraphics, reflectXRight, canvasSize / 2);
    //left image
    image(scene.reflectionLeftGraphics, reflectXLeft, canvasSize / 2);

    if (i === 0 && !dimensions.length) {
      //right dimensions
      dimensions.push({
        attachXStart: scene.mirror2X,
        attachXEnd: reflectXRight,
        attachY: attachY - scene.dimensionIncrementY,
      });

      //left dimensions
      dimensions.push({
        attachXStart: reflectXLeft,
        attachXEnd: scene.mirror1X,
        attachY: attachY - scene.dimensionIncrementY,
      });
    } else if (i === 1 && !pivot) {
      pivot = {
        attachXStart: scene.mirror1X,
        attachXEnd: reflectRPrev,
        attachYStart: attachY - scene.dimensionIncrementY * 3,
        attachYEnd: attachY - scene.dimensionIncrementY * 3,
      };

      pivotLength = pivot.attachXEnd - pivot.attachXStart;
      pivotStartX = pivot.attachXStart;
      pivotEndX = pivot.attachXEnd;
      pivotStartY = pivot.attachYStart;
      pivotEndY = pivot.attachYEnd;
    }

    rPrev = totalUnitsLeft;
    lPrev = totalUnitsRight;
    reflectRPrev = reflectXRight;
    reflectLPrev = reflectXLeft;
  }
  finalX = reflectRPrev;
  drawDimensions();
}

function createObjectGraphics(objectType = "objectGraphics") {
  let objectFill = [218, 59, 95];
  if (objectType === "reflectionRightGraphics") {
    objectFill = scene.reflectionRightFill;
  } else if (objectType === "reflectionLeftGraphics") {
    objectFill = scene.reflectionLeftFill;
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
  //create the initial dimension data
  attachY = canvasSize / 2;

  const observerX =
    scene.mirror2X - scene.objectUnitsFromRightMirror * gridSpace;

  dimensions.push(
    {
      attachXStart: observerX,
      attachXEnd: scene.mirror2X,
      attachY: attachY - scene.dimensionIncrementY,
    },
    {
      attachXStart: scene.mirror1X,
      attachXEnd: observerX,
      attachY: attachY - scene.dimensionIncrementY,
    }
  );

  dimensions.push(
    {
      attachXStart: scene.mirror2X,
      attachXEnd: scene.mirror2X + scene.mirror2X - observerX,
      attachY: attachY - scene.dimensionIncrementY,
    }
    // {
    //   attachXStart: scene.mirror1X - (observerX - scene.mirror1X),
    //   attachXEnd: scene.mirror1X,
    //   attachY: attachY - scene.dimensionIncrementY,
    // }
  );

  dimensions.push({
    attachXStart: scene.mirror1X,
    attachXEnd: scene.mirror2X,
    attachY: attachY - scene.dimensionIncrementY * 2,
  });

  dimYIndex++;
}

function drawPivot() {
  stroke(scene.pivotFill);
  strokeWeight(scene.pivotWeight);
  strokeCap(ROUND);
  if (pivotDrawStage === -1) {
    stroke(0);
    strokeWeight(1);
    const totalLineLength = scene.dimensionIncrementY * 3;
    const curStartY = pivotEndY + totalLineLength;
    line(
      pivotEndX,
      pivotEndY + scene.dimensionIncrementY * 3,
      pivotEndX,
      curStartY - curStartLineLength
    );
    if (curStartLineLength < totalLineLength) {
      curStartLineLength += scene.animationIncrement;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 0) {
    line(pivotEndX, pivotEndY, pivotEndX - curPivotLength, pivotEndY);
    if (curPivotLength < pivotLength) {
      curPivotLength += scene.animationIncrement;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 1) {
    line(pivotStartX, pivotStartY, pivotStartX + curPivotLength, pivotEndY);
    if (curPivotLength > 0) {
      curPivotLength -= scene.animationIncrement;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 2) {
    line(pivotStartX, pivotStartY, pivotStartX - curPivotLength, pivotEndY);
    if (-curPivotLength > -pivotLength) {
      curPivotLength += scene.animationIncrement;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 3) {
    line(pivotStartX, pivotStartY, pivotStartX - curPivotLength, pivotEndY);
    stroke(0);
    strokeWeight(1);
    line(
      pivotStartX - curPivotLength,
      pivotStartY,
      pivotStartX - curPivotLength,
      pivotStartY + curReflectLineLength
    );
    if (curReflectLineLength < scene.dimensionIncrementY * 3) {
      curReflectLineLength += scene.animationIncrement * 2;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 4) {
    //animate removal of reflect line and pivot line
    line(pivotStartX, pivotStartY, pivotStartX - curPivotLength, pivotEndY);
    stroke(0);
    strokeWeight(1);
    line(
      pivotStartX - curPivotLength,
      pivotStartY,
      pivotStartX - curPivotLength,
      pivotStartY + curReflectLineLength
    );

    if (curReflectLineLength > 0) {
      curReflectLineLength -= scene.animationIncrement * 2;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 5) {
    line(pivotStartX, pivotStartY, pivotStartX - curPivotLength, pivotEndY);
    if (curPivotLength > 0) {
      curPivotLength -= scene.animationIncrement;
    } else {
      pivotDrawStage++;
    }
  } else if (pivotDrawStage === 6) {
    stroke(scene.pivotFill);
    strokeWeight(scene.pivotWeight);
    line(
      scene.mirror2X,
      pivotStartY,
      scene.mirror2X + finalReflectLineLength,
      pivotStartY
    );
    if (finalReflectLineLength < finalX - scene.mirror2X) {
      finalReflectLineLength += scene.animationIncrement;
    } else {
      drawSolveText({
        startX: scene.mirror2X,
        y: pivotStartY,
        endX: scene.mirror2X + finalReflectLineLength,
      });
      drawGrid = false;
      //needsUpdate = false;
    }
  }
}

function drawSolveText(solveDims) {
  textAlign(CENTER, BOTTOM);
  fill(0);
  stroke(255);
  textSize(scene.dimensionTextSize);

  let textX = solveDims.startX + (solveDims.endX - solveDims.startX) / 2;
  let textY = solveDims.y - gridSpace * 2;

  text("???", textX, textY);
}

function drawDimensions() {
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
  angleMode(DEGREES);
  drawBaseLayers();
  drawPivot();
}

function drawBaseLayers() {
  if (drawGrid) {
    createGrid();
  }

  createMirrors();
  createObserver();
  createObjectGraphics("objectGraphics");
  createObjectGraphics("reflectionRightGraphics");
  createObjectGraphics("reflectionLeftGraphics");
  addObject();
  addDimensions();
  addObjectReflections();
}

function draw() {
  if (needsUpdate) {
    clear();
    drawBaseLayers();
    drawPivot();
  }
}