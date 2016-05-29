$(function(){

  // This demo depends on the canvas element
  if(!('getContext' in document.createElement('canvas'))){
    alert('Sorry, it looks like your browser does not support canvas!');
    return false;
  }

  // The URL of your web server (the port is set in app.js)
  var url = 'http://localhost:3000';

  var doc = $(document),
    win = $(window),
    canvas = $('#paper'),
    ctx = canvas[0].getContext('2d'),
    instructions = $('#instructions');

  // Generate an unique ID
  var id = Math.round($.now()*Math.random());
  
  // A flag for drawing activity
  var drawing = false;

  var clients = {};
  var cursors = {};

  var points = [];

  var socket = io.connect(url);
  
  socket.on('moving', function (data) {
    
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
      
      drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
    }
    
    // Saving the current client state
    clients[data.id] = data;
    clients[data.id].updated = $.now();
  });

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
      socket.emit('mousemove',{
        'x': e.pageX,
        'y': e.pageY,
        'drawing': drawing,
        'id': id
      });
      lastEmit = $.now();
    }
    
    // Draw a line for the current user's movement, as it is
    // not received in the socket.on('moving') event above
    
    if(drawing){
      
      points.push({ x: e.clientX, y: e.clientY });

      // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      drawLine(prev.x, prev.y, e.pageX, e.pageY);
      
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

  function drawLine(fromx, fromy, tox, toy){
    // Round those lines
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgb(0, 0, 0)';
    ctx.strokeStyle = '#ff00aa';
    ctx.lineJoin = ctx.lineCap = 'round';

    // var p1 = points[0];
    // var p2 = points[1];
    
    // ctx.beginPath();
    // ctx.moveTo(p1.x, p1.y);
    // console.log(points);

    // for (var i = 1, len = points.length; i < len; i++) {
    //   // we pick the point between pi+1 & pi+2 as the
    //   // end point and p1 as our control point
    //   var midPoint = midPointBtw(p1, p2);
    //   ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    //   p1 = points[i];
    //   p2 = points[i+1];
    // }
    // // Draw last line as a straight line while
    // // we wait for the next point to be able to calculate
    // // the bezier control point
    // ctx.lineTo(p1.x, p1.y);
    // ctx.stroke();

    // // ctx.beginPath();
    // // ctx.moveTo(points[0].x, points[0].y);
    // // for (var i = 1; i < points.length; i++) {
    // //   ctx.lineTo(points[i].x, points[i].y);
    // // }


    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    // // move to the first point
  //      ctx.moveTo(points[0].x, points[0].y);


    // for (i = 1; i < points.length - 2; i ++) {
    //  var xc = (points[i].x + points[i + 1].x) / 2;
    //  var yc = (points[i].y + points[i + 1].y) / 2;
    //  ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    // }
    // // curve through the last two points
    // ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x,points[i+1].y);

  }

});