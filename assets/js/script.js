$(function(){

  // This demo depends on the canvas element
  if(!('getContext' in document.createElement('canvas'))){
    alert('Sorry, it looks like your browser does not support canvas!');
    return false;
  }

  var doc = $(document),
    win = $(window),
    canvas = $('#paper'),
    ctx = canvas[0].getContext('2d'),
    instructions = $('.instructions');

  // Generate a unique ID
  var id = Math.round($.now()*Math.random());

  // A flag for drawing activity
  var drawing = false;

  // Stroke Colors
  var color1 = '123,199,77', // '57,62,70',
      color2 = '238,238,238';

  var clients = {};
  var cursors = {};

  var points = [];

  var host = location.origin.replace(/^http/, 'ws')
  var ws = new WebSocket(host);

  // Listen for data, and draw lines
  ws.onmessage = function (event) {

    var data = JSON.parse(event.data);

    if(! (data.id in clients)){
      // a new user has come online. create a cursor for them
      cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
    }

    // Move the mouse pointer
    cursors[data.id].css({
      'left' : data.x,
      'top' : data.y
    });

    // Is the user drawing?
    if(data.drawing && clients[data.id]){

      // Draw a line on the canvas. clients[data.id] holds
      // the previous position of this user's mouse pointer

      points = data.points;

      drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, 'rgba('+ color1 +', 0.3)');
    }

    // Saving the current client state
    clients[data.id] = data;
    clients[data.id].updated = $.now();
  };

  var prev = {};

  canvas.on('mousedown',function(e){
    e.preventDefault();
    drawing = true;
    prev.x = e.pageX;
    prev.y = e.pageY;

    // Hide the instructions
    instructions.fadeOut();
  });

  doc.bind('mouseup mouseleave',function(){
    drawing = false;
    points.length = 0;
  });

  var lastEmit = $.now();

  doc.on('mousemove',function(e){
    if($.now() - lastEmit > 30){
      ws.send(JSON.stringify({
        'x': e.pageX,
        'y': e.pageY,
        'drawing': drawing,
        'id': id,
        'points': points
      }));
      lastEmit = $.now();
    }

    // Draw a line for the current user's movement, as it is
    // not received in the socket.on('moving') event above

    if(drawing){

      points.push({ x: e.clientX, y: e.clientY });

      // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      drawLine(prev.x, prev.y, e.pageX, e.pageY, 'rgba('+ color2 +', 0.3)');

      prev.x = e.pageX;
      prev.y = e.pageY;
    }
  });

  // Remove inactive clients after 10 seconds of inactivity
  setInterval(function(){

    for(ident in clients){
      if($.now() - clients[ident].updated > 10000){

        // Last update was more than 10 seconds ago.
        // This user has probably closed the page

        cursors[ident].remove();
        delete clients[ident];
        delete cursors[ident];
      }
    }

  },10000);

  function midPointBtw(p1, p2) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
  }

  function drawLine(fromx, fromy, tox, toy, color){

    // // Original line
    // Round those lines
    // ctx.lineCap = 'round';
    // ctx.lineWidth = 10;
    // ctx.shadowBlur = 20;
    // ctx.shadowColor = 'rgb(0, 0, 0)';
    // ctx.strokeStyle = '#000000';
    // ctx.lineJoin = ctx.lineCap = 'round';
    // ctx.moveTo(fromx, fromy);
    // ctx.lineTo(tox, toy);
    // ctx.stroke();

    // Following technique used courtesy of Juriy "kangax" Zaytsev, full bog post here: http://perfectionkills.com/exploring-canvas-drawing-techniques/
    var lastPoint = points[points.length-1];

    for (var i = 0, len = points.length; i < len; i++) {
      dx = points[i].x - lastPoint.x;
      dy = points[i].y - lastPoint.y;
      d = dx * dx + dy * dy;

      if (d < 1000) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(lastPoint.x + (dx * 0.2), lastPoint.y + (dy * 0.2));
        ctx.lineTo(points[i].x - (dx * 0.2), points[i].y - (dy * 0.2));
        ctx.stroke();
      }
    }

    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
  }

});
