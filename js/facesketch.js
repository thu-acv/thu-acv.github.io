
var data, labels;
var layer_defs, net, trainer;

// create neural net
var t = "layer_defs = [];\n\
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2}); // 2 inputs: x, y \n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'regression', num_neurons:3}); // 3 outputs: r,g,b \n\
\n\
net = new convnetjs.Net();\n\
net.makeLayers(layer_defs);\n\
\n\
trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, momentum:0.9, batch_size:5, l2_decay:0.0});\n\
";


var trainLoss = []; // dataPoints
var dataLength = 500; // number of dataPoints visible at any point
var plot = [];

var batches_per_iteration = 100;
var mod_skip_draw = 100;
var log_skip_draw = 20;
var smooth_loss = -1;
var tickid = 0;

function update(){
  // forward prop the data
  var W = nn_canvas.width;
  var H = nn_canvas.height;

  var p = oridata.data;
  var sp = sketchdata.data;

  var v = new convnetjs.Vol(1,1,2);
  var loss = 0;
  var lossi = 0;
  var N = batches_per_iteration;
  for(var iters=0;iters<trainer.batch_size;iters++) {
    for(var i=0;i<N;i++) {
      // sample a coordinate
      var x = convnetjs.randi(0, W);
      var y = convnetjs.randi(0, H);
      var ix = ((W*y)+x)*4;
      var r = [sp[ix]/255.0, sp[ix+1]/255.0, sp[ix+2]/255.0]; // r g b
      v.w[0] = (x-W/2)/W;
      v.w[1] = (y-H/2)/H;
      var stats = trainer.train(v, r);
      loss += stats.loss;
      lossi += 1;
    }
  }
  loss /= lossi;

  if(counter === 0) {
    smooth_loss = loss;
    plot = $.plot("#placeholder", [{
      data:[], 
      lines: { show: true }}], {
      series: {
        shadowSize: 0 // Drawing is faster without shadows
      },
      yaxis: {
        min: 0,
        max: smooth_loss
      },
      xaxis: {
        show: true
      }
    });
  }
  else smooth_loss = 0.99*smooth_loss + 0.01*loss;
   // console.log(smooth_loss)

  // report
  var t = '';
  t += ' loss: ' + smooth_loss.toFixed(4);
  t += ', iter: ' + counter;
  $("#report").html(t);
}

function draw() {

  // update plot
  if(counter % log_skip_draw == 0) {
    trainLoss.push([counter, smooth_loss])
    plot.setData([trainLoss]);
    plot.setupGrid()
    plot.draw();    
  }

  if(counter % mod_skip_draw !== 0) return;

  // iterate over all pixels in the target array, evaluate them
  // and draw
  var W = nn_canvas.width;
  var H = nn_canvas.height;

  var g = nn_ctx.getImageData(0, 0, W, H);
  // layers
  var l1 = layer1_ctx.getImageData(0, 0, W, H);
  var l2 = layer2_ctx.getImageData(0, 0, W, H);
  var l3 = layer3_ctx.getImageData(0, 0, W, H);
  var l4 = layer4_ctx.getImageData(0, 0, W, H);

  var v = new convnetjs.Vol(1, 1, 2);
  for(var x=0;x<W;x++) {
    v.w[0] = (x-W/2)/W;
    for(var y=0;y<H;y++) {
      v.w[1] = (y-H/2)/H;

      var ix = ((W*y)+x)*4;
      var r = net.forward(v);
      g.data[ix+0] = Math.floor(255*r.w[0]);
      g.data[ix+1] = Math.floor(255*r.w[1]);
      g.data[ix+2] = Math.floor(255*r.w[2]);
      g.data[ix+3] = 255; // alpha...

      // layer1
      var act = net.layers[6].out_act;
      l1.data[ix+0] = Math.floor(255*act.w[0]);
      l1.data[ix+1] = Math.floor(255*act.w[0]);
      l1.data[ix+2] = Math.floor(255*act.w[0]);
      l1.data[ix+3] = 255; // alpha...

      // layer2
      var act = net.layers[8].out_act;
      l2.data[ix+0] = Math.floor(255*act.w[0]);
      l2.data[ix+1] = Math.floor(255*act.w[0]);
      l2.data[ix+2] = Math.floor(255*act.w[0]);
      l2.data[ix+3] = 255; // alpha...
      // layer3
      var act = net.layers[10].out_act;
      l3.data[ix+0] = Math.floor(255*act.w[0]);
      l3.data[ix+1] = Math.floor(255*act.w[0]);
      l3.data[ix+2] = Math.floor(255*act.w[0]);
      l3.data[ix+3] = 255; // alpha...
      // layer4
      var act = net.layers[12].out_act;
      l4.data[ix+0] = Math.floor(255*act.w[0]);
      l4.data[ix+1] = Math.floor(255*act.w[0]);
      l4.data[ix+2] = Math.floor(255*act.w[0]);
      l4.data[ix+3] = 255; // alpha...
      
    }
  }
  nn_ctx.putImageData(g, 0, 0);
  layer1_ctx.putImageData(l1, 0, 0);
  layer2_ctx.putImageData(l2, 0, 0);
  layer3_ctx.putImageData(l3, 0, 0);
  layer4_ctx.putImageData(l4, 0, 0);


}

var abort_tick = function() {
  console.log('aborting demo because it takes too long in this browser.');
  $("#demomsg").text('live demo aborted (slow browser)');
  clearInterval(tickid);
}

function tick() {
  var t0 = +new Date();
  update();
  draw();
  counter += 1;
  var t1 = +new Date();
  var dt = t1 - t0;
  if(dt > 3000) {
    abort_tick();
  }
}

function reload() {
  counter = 0;
  eval(t);
}


var ori_canvas, nn_canvas, ori_ctx, nn_ctx, oridata;
var width = 100; // width of our drawing area
var height = 125; // height of our drawing area

var counter = 0;
$(function() {

    // dynamically load lena image into original image canvas
    var image = new Image();
    //image.src = "lena.png";
    image.onload = function() {

      ori_canvas = document.getElementById('canv_original');
      sketch_canvas = document.getElementById('canv_sketch');
      nn_canvas = document.getElementById('canv_net');
      ori_canvas.width = width;
      ori_canvas.height = height;
      sketch_canvas.width = width;
      sketch_canvas.height = height;
      nn_canvas.width = width;
      nn_canvas.height = height;
      // layers
      layer1 = document.getElementById('layer_1');
      layer2 = document.getElementById('layer_2');
      layer3 = document.getElementById('layer_3');
      layer4 = document.getElementById('layer_4');
      layer1.width = width; layer1.height = height;
      layer2.width = width; layer2.height = height;
      layer3.width = width; layer3.height = height;
      layer4.width = width; layer4.height = height;

      ori_ctx = ori_canvas.getContext("2d");
      sketch_ctx = sketch_canvas.getContext("2d");
      nn_ctx = nn_canvas.getContext("2d");
      ori_ctx.drawImage(image, 0, 0, width, height);
      sketch_ctx.drawImage(sketch, 0, 0, width, height);
      oridata = ori_ctx.getImageData(0, 0, width, height); // grab the data pointer. Our dataset.
      sketchdata = sketch_ctx.getImageData(0, 0, width, height); // grab the data pointer. Our dataset.
      // layers
      layer1_ctx = layer1.getContext("2d");
      layer2_ctx = layer2.getContext("2d");
      layer3_ctx = layer3.getContext("2d");
      layer4_ctx = layer4.getContext("2d");


      // start the regression!
      tickid = setInterval(tick, 1);
    }

    var gender = convnetjs.randi(0, 1);
    var sampleidx = convnetjs.randi(10, 30);


    // Sketch
    var sketch = new Image(); 
    if (gender == 0) {
      image.src = "cuhkfacesketch/sketches/F2-0"+ sampleidx + "-01-sz1.jpg";
      sketch.src = "cuhkfacesketch/photos/f-0" + sampleidx + "-01.jpg";
    } else  {
      image.src = "cuhkfacesketch/sketches/M2-0"+ sampleidx + "-01-sz1.jpg";
      sketch.src = "cuhkfacesketch/photos/m-0" + sampleidx + "-01.jpg";
    } 

    // init put text into textarea
    $("#layerdef").val(t);

    // load the net
    reload();

    $('#convask').click(function(){
      $("#explain").slideToggle('fast');
    })

    $('#convask').hover(
        function() {
          $( this ).addClass( "hover" );
        }, function() {
          $( this ).removeClass( "hover" );
    })
});
