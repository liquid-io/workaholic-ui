var mqtt = require('mqtt').connect('mqtt://localhost:2048');
var chalk = require('chalk');
var Controller = require('@matteo.collina/cocktail-control');
var level = require('level')
var parallel = require('fastparallel')();
var EE = require('events').EventEmitter;
var mqttToSocketIoEE = new EE();

var cocktails = {
  darkAndStormy: {
    activations: [
      {drink: 'ginger beer', time: 120000}, // milleseconds
      {drink: 'rum', time: 40000},
      {drink: 'lime', time: 20000}
    ]
  },
  rumAndCoke: {
    activations: [
      {drink: 'coke', time: 60000}, // milleseconds
      {drink: 'coke', time: 60000},
      {drink: 'rum', time: 20000}
    ]
  },
  moscowMule: {
    activations: [
      {drink: 'vodka', time: 60000}, // milleseconds
      {drink: 'lime', time: 15000},
      {drink: 'ginger beer', time: 120000}
    ]
  },
  seabreeze: {
    activations: [
      {drink: 'vodka', time: 60000}, // milleseconds
      {drink: 'cranberry', time: 60000},
      {drink: 'pineapple', time: 120000}
    ]
  },
  whiskeySour: {
    activations: [
      {drink: 'whiskey', time: 60000}, // milleseconds
      {drink: 'lemon juice', time: 30000},
      {drink: 'gomme syrup', time: 15000}
    ]
  },
  crazyWolf: {
    activations: [
      {drink: 'whiskey', time: 60000}, // milleseconds
      {drink: 'peach schnapps', time: 30000},
      {drink: 'pinapple', time: 120000}
    ]
  }
  crazy: {
    activations: [
      {drink: 'whiskey', time: 60000}, // milleseconds
      {drink: 'pineapple', time: 60000},
      {drink: 'coke', time: 160000}
    ]
  }
}

var defs = {
  cocktails: cocktails,
  workers: {
    pi1: {
      cocktails: ['crazy'] //cocktails a worker can make
    },
    pi2: {
      cocktails: ['vodka', 'spritz']
    }
  }
}

var db = level('./db')
var controller = Controller(db, defs)

var drinksServed = 0;

var connectedWorkers = {};
var pingInterval;

mqtt.on('connect', function() {
  mqtt.subscribe('connections');

  ping();
  pingInterval = setInterval(ping, 10000)

  logging(chalk.yellow('Server up!'));
})

function ping(){
  //only ping the defined workers
  Object.keys(defs.workers).forEach(function(key){
    mqtt.publish(key, JSON.stringify({status: 'ping'}));
  });
}

mqtt.on('message', function(topic, message) {
  logging(chalk.blue('(topic: '+topic+') ') + chalk.white(message.toString()));

  message = JSON.parse(message);

  if      (topic === 'connections') handleConnectionsTopicMessages();
  else    handleOtherTopic();

  // handle connection topic logic.
  // the connection topic is a topic for meta information that is only relevant for the server.
  function handleConnectionsTopicMessages(){
    var worker = message.worker;

    if(message.status === 'worker here'){

      // if worker not in the definitions
      if(!defs.workers[worker]){
        return;
      }

      if(!connectedWorkers[worker]) workerConnected(worker);

      if(!connectedWorkers[worker].ready && message.ready) {
        logging(chalk.yellow('worker ('+worker+') is now ready for work.'));
        connectedWorkers[worker].ready = true;
        mqttToSocketIoEE.emit('worker update', worker)
      }

      connectedWorkers[worker].ready = message.ready;


      resetWorkerDisconnectTimeout(worker);
    }
  }

  // handle topics for workers.
  function handleOtherTopic(){
    var worker = topic;

    if(!defs.workers[worker]) return;

    resetWorkerDisconnectTimeout(worker);

    if(message.status === 'mix ready'){
      var job = message.job;
      var msg = '(ID: '+job.id+') Mix ready for ' + job.name + '. They ordered a ' + job.cocktail + '.'

      logging(chalk.yellow(msg));

      drinksServed++;

      connectedWorkers[worker].jobs.forEach(function(workersJob){
        if(workersJob.id === job.id) workersJob = job;
      });
      mqttToSocketIoEE.emit('drink mixed', {worker: worker, message: msg})
    }
    if(message.status === 'button pressed'){
      if(freeWorker(worker)) logging(chalk.yellow('Worker sent work successfully! (Worker: '+worker+')'));
      else logging(chalk.red('failed to send worker work. (Worker: '+worker+')'));
    }
  }

});

// params: worker - String.
//
// worker is a string of a workerID. 
//
// A worker will only be freed if it is connected and ready
//
// returns true if successfully freed worker.
// returns false if failure freeing.
function freeWorker(worker){
  if(connectedWorkers[worker] && connectedWorkers[worker].ready){
    logging(chalk.yellow('assigning work to worker: ' + worker))

    connectedWorkers[worker].jobs = [];
    controller.free(worker);

    return true;
  } 
  return false;
}

// method to handle logic of a worker connecting
function workerConnected(worker){
  connectedWorkers[worker] = {};
  connectedWorkers[worker].worker = defs.workers[worker];

  mqtt.subscribe(worker); // subscribe to the worker
  
  // controller emitted some jobs for the worker
  controller.on(worker, function(executables){
    connectedWorkers[worker].ready = false;
    connectedWorkers[worker].jobs = executables.jobs;

    mqtt.publish(worker, JSON.stringify({status: 'new jobs', jobs: executables.jobs}));
    mqttToSocketIoEE.emit('queue update');
    mqttToSocketIoEE.emit('worker update', worker)
  });
}

// method to handle logic of a user timing out
function resetWorkerDisconnectTimeout(worker){
  if(connectedWorkers[worker].disconnectTimeout){
    clearTimeout(connectedWorkers[worker].disconnectTimeout);
  }

  connectedWorkers[worker].disconnectTimeout = setTimeout(function(){
    logging(chalk.red('Worker disconnected: ' + worker));
    mqtt.unsubscribe(worker);
    delete connectedWorkers[worker];
  }, 30000) 
}

function getAvailableDrinks(){
  var availableDrinks = [];
  Object.keys(connectedWorkers).forEach(function(worker){
    if(connectedWorkers[worker].worker && connectedWorkers[worker].worker.cocktails){
      connectedWorkers[worker].worker.cocktails.forEach(function(cocktail){
        if(availableDrinks.indexOf(cocktail) < 0) availableDrinks.push(cocktail);
      });
    }
  });
  return availableDrinks;
}


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname+'/views/index.html');
});

http.listen(4000, function(){
  logging(chalk.yellow('listening on *:3000'));
});

io.on('connection', function(socket){  
  setImmediate(sendQueue);
  setImmediate(sendAvailableDrinks);
  setImmediate(sendCurrentWorkers);

  socket.on('add drink to queue', function(job){
    logging(chalk.yellow('adding a drink to the queue: ') + job.cocktail + '. for ' + job.name);
    controller.enqueue(job)
    sendQueue();
  });

  socket.on('get queue', sendQueue);
  socket.on('get available drinks', sendAvailableDrinks);
  socket.on('get current workers', sendCurrentWorkers);

  mqttToSocketIoEE.on('drink mixed', drinkMixed);
  mqttToSocketIoEE.on('worker update', updateWorker)
  mqttToSocketIoEE.on('queue update', sendQueue);

  function drinkMixed(obj){
    updateWorker(obj.worker);

    socket.emit('drinks served', drinksServed);
    socket.emit('notification', {heading: 'Drink Ready!', message: obj.message});
  }

  function updateWorker(worker){
    var workaholic = sendWorker(worker);

    socket.emit('drinks served', drinksServed);

    socket.emit('update worker', workaholic);
  };

  function sendQueue(){
    socket.emit('current queue', controller.queue);
  }

  function sendAvailableDrinks(){
    socket.emit('available drinks', getAvailableDrinks());
  }

  function sendCurrentWorkers(){
    var workers = []

    Object.keys(connectedWorkers).forEach(function(worker){
      workers.push(sendWorker(worker));
    });

    socket.emit('current workers', workers);
  }

  function sendWorker(worker){
    var workerToSend = {};
    workerToSend.name = worker;
    workerToSend.worker = connectedWorkers[worker].worker;
    workerToSend.jobs = connectedWorkers[worker].jobs;
    workerToSend.ready = connectedWorkers[worker].ready;
    return workerToSend;
  }
});

function logging(str){
  console.log(chalk.green(new Date().toString()), chalk.white(str));
}

