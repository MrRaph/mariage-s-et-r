window._grid = {
  size: 7,
  gridWidth: 75
}

var gridState = '';
var pawnPosition = [0,0];
var authorizedWays = [];
var goalNb;

var images = [];
var pawnImage;
var arrowImages = [];

function loadImages() {
  for (i = 0; i < 12; i++) {
    index = images.length;
    images[index] = new Image();
    path = "img/" + Math.floor(i/4) + (i%4) + ".png";
    images[index].src = path;
  }

  pawnImage = new Image();
  pawnImage.src = "img/pawn.png";

  for (i = 0; i < 4; i++) {
    index = arrowImages.length;
    arrowImages[index] = new Image();
    path = "img/arrow" + i + ".png";
    arrowImages[index].src = path;
  }
}

function drawBoardGame() {
  var canvas = document.getElementById('boardgame');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (gridState != '') {
    for (i = 0; i < _grid.size; i++) {
      for (j = 0; j < _grid.size; j++) {
        drawGridBlock(ctx, i, j);
      }
    }
    drawIcons(ctx);
    drawPawn(ctx);
    writeGoal();
  }
  else {
    // No grid state...
  }
}

function drawGridBlock(ctx, i, j) {
  var w = _grid.gridWidth;
  var x = i * w;
  var y = j * w;
  var imageIndex = window._mapContent[i][j]*4 + gridState[i][j];
  ctx.drawImage(images[imageIndex], x, y, w, w);
}

function drawIcons(ctx) {
    ctx.font = '32px FontAwesome';
    ctx.fillStyle = '#636363';
    var w = _grid.gridWidth;
    var offsetX = 2;
    var offsetY = 30;
    for (var i = 0; i < _icons.code.length; i++) {
      ctx.fillText(_icons.code[i], offsetX + w/4 + _icons.posX[i]*w, offsetY + w/4 + _icons.posY[i]*w);
    }
}

function drawPawn(ctx) {
  var w = _grid.gridWidth;
  var pawnX = pawnPosition[0] * w;
  var pawnY = pawnPosition[1] * w;
  ctx.drawImage(pawnImage, pawnX, pawnY, w, w);
  drawArrows(ctx);
}

function drawArrows(ctx) {
  authorizedWays = [];
  var gridWidth = _grid.gridWidth;
  var width = _grid.gridWidth / 2;
  var pawnX = pawnPosition[0];
  var pawnY = pawnPosition[1];
  var offsetCenter = 0.25;
  var offsetMargin = 0.1;
  var offsetSide = 0.5;
  if (pawnY > 0 && isEscapableByWay(0, pawnX, pawnY) && isEscapableByWay(2, pawnX, pawnY-1)) {
    ctx.drawImage(arrowImages[0], (pawnX+offsetCenter)*gridWidth, (pawnY-offsetMargin)*gridWidth, width, width);
    authorizedWays[authorizedWays.length] = 0;
  }
  if (pawnX < _grid.size-1 && isEscapableByWay(1, pawnX, pawnY) && isEscapableByWay(3, pawnX+1, pawnY)) {
    ctx.drawImage(arrowImages[1], (pawnX+offsetMargin+offsetSide)*gridWidth, (pawnY+offsetCenter)*gridWidth, width, width);
    authorizedWays[authorizedWays.length] = 1;
  }
  if (pawnY < _grid.size-1 && isEscapableByWay(2, pawnX, pawnY) && isEscapableByWay(0, pawnX, pawnY+1)) {
    ctx.drawImage(arrowImages[2], (pawnX+offsetCenter)*gridWidth, (pawnY+offsetSide+offsetMargin)*gridWidth, width, width);
    authorizedWays[authorizedWays.length] = 2;
  }
  if (pawnX > 0 && isEscapableByWay(3, pawnX, pawnY) && isEscapableByWay(1, pawnX-1, pawnY)) {
    ctx.drawImage(arrowImages[3], (pawnX-offsetMargin)*gridWidth, (pawnY+offsetCenter)*gridWidth, width, width);
    authorizedWays[authorizedWays.length] = 3;
  }
}

function writeGoal() {
  $("#goalName").text(_icons.name[goalNb]);
}

function isEscapableByWay(direction, x, y) {
  var cellType = _mapContent[x][y].toString();
  var cellState = gridState[x][y].toString();
  return window._tilesByPaths[direction].indexOf(cellType + cellState) != -1
}

function clickOnCell(x, y, direction) {
    if (pawnPosition[0] == x && pawnPosition[1] == y) {
      movePawn(direction);
    }
    else {
      turnBlock(x, y);
    }
}

function loadState() {
  if (window._session) {
  	$.ajax({
      method: 'GET',
  		url: _config.api.invokeUrl,
      headers: {
        Authorization: window._session.getIdToken().getJwtToken()
      }
  	}).then(function(data) {
      updateGridState(data);
  	});
  }
}

function turnBlock(x, y) {
  var data = JSON.stringify({ x: x, y: y});
  $.ajax({
    method: 'POST',
    url: _config.api.invokeUrl,
    headers: {
      Authorization: window._session.getIdToken().getJwtToken()
    },
    data: data
  }).then(function(data) {
    updateGridState(data);
  });
}

function updateGridState(data) {
  gridState = JSON.parse(data["grid"]["S"]);
  pawnPosition = JSON.parse(data["pawn"]["S"]);
  goalNb = JSON.parse(data["goalNb"]["N"]);
  drawBoardGame();
}

function movePawn(direction) {
  if (authorizedWays.indexOf(direction) != -1) {
    var end = [pawnPosition[0], pawnPosition[1]];
    switch(direction) {
      case 0 :
        end[1]--;
        break;
      case 1 :
        end[0]++;
        break;
      case 2 :
        end[1]++;
        break;
      case 3 :
        end[0]--;
        break;
    }
    var data = JSON.stringify({ begin: JSON.stringify(pawnPosition), end: JSON.stringify(end)});
    $.ajax({
      method: 'POST',
      url: _config.api.invokeUrl+'/pawn',
      headers: {
        Authorization: window._session.getIdToken().getJwtToken()
      },
      data: data
    }).then(function(data) {
      updateGridState(data);
    });
  }
}



function refresh() {
  loadState();
}

var myTimer;
function autoRefreshUpdate()
{
  if (document.getElementById('autoRefresh').checked) {
    myTimer = setInterval(refresh, 500);
  }
  else {
    clearInterval(myTimer);
  }
}

$(document).ready(function() {
  loadImages();
  loadState();
  document.getElementById('boardgame').onclick = function(event) {
    var xIndex = Math.floor(event.offsetX / _grid.gridWidth);
    var yIndex = Math.floor(event.offsetY / _grid.gridWidth);
    var centerX = (xIndex+0.5) * _grid.gridWidth;
    var centerY = (yIndex+0.5) * _grid.gridWidth;;
    var deltaX = event.offsetX - centerX;
    var deltaY = event.offsetY - centerY;
    var direction;
    if (deltaY < 0 && Math.abs(deltaX) < Math.abs(deltaY)) {direction = 0;}
    if (deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY)) {direction = 1;}
    if (deltaY > 0 && Math.abs(deltaX) < Math.abs(deltaY)) {direction = 2;}
    if (deltaX < 0 && Math.abs(deltaX) > Math.abs(deltaY)) {direction = 3;}
    clickOnCell(xIndex, yIndex, direction);
  };
});
