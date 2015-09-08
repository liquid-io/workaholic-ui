var mqtt = require('mqtt').connect('mqtt://localhost:2048');
var chalk = require('chalk');
var Controller = require('@matteo.collina/cocktail-control');
var level = require('level')
var parallel = require('fastparallel')();
var db = level('./db');
var EE = require('events').EventEmitter;
var mqttToSocketIoEE = new EE();

var defs = require('./default-defs.js');
var controller = {};
var drinksServed = 0;

db.get('numServed', function(err, num){
  if(err) db.put('numServed', '0');
  else drinksServed = Number(num);
  mqttToSocketIoEE.emit('queue update');
});

db.get('defs', function(err, dbDefs){
  if(err) db.put('defs', JSON.stringify(defs), function(err){
    if(err) logging(chalk.red('problem putting default defitions in db'));
  });
  else defs = JSON.parse(dbDefs);

  controller = Controller(db, defs);
  
  ping();
  mqttToSocketIoEE.emit('queue update')
});

var connectedWorkers = {};

mqtt.on('connect', function() {
  mqtt.subscribe('connections');

  setInterval(ping, 5000);

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
    if(message.status === 'worker here'){
      var worker = message.worker;

      // if worker not in the definitions
      if(!defs.workers[worker]){
        logging(chalk.red('worker ('+worker+') connected, but is not in the worker definitions, so we will ignore him.'));
        return;
      }

      if(!connectedWorkers[worker]) workerConnected(worker, message.ready);

      if(!connectedWorkers[worker].ready && message.ready) {
        logging(chalk.yellow('worker ('+worker+') is now ready for work.'));
        connectedWorkers[worker].ready = true;
        mqttToSocketIoEE.emit('worker update', worker)
      }

      connectedWorkers[worker].ready = message.ready;
      connectedWorkers[worker].jobs = [];

      resetWorkerDisconnectTimeout(worker);
    }
  }

  // handle topics for workers.
  function handleOtherTopic(){
    var worker = topic;

    if(!defs.workers[worker]) return;

    if(message.status !== 'ping') resetWorkerDisconnectTimeout(worker);

    if(message.status === 'job complete'){
      var job = message.job;
      if(message.job.name === 'clean'){
        return;
      }
      var msg = '(ID: '+job.id+') Mix ready for ' + job.name + '. They ordered a ' + job.cocktail + '.'

      logging(chalk.yellow(msg));

      drinksServed++;
      db.put('numServed', '' + drinksServed)

      connectedWorkers[worker].jobs.forEach(function(workersJob){
        if(workersJob.id === job.id) workersJob = job;
      });
      if(connectedWorkers[worker].jobs.indexOf(job) < 0) connectedWorkers[worker].jobs.push(job);
      mqttToSocketIoEE.emit('drink mixed', {worker: worker, message: msg, finishedJob: job})
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
  connectedWorkers[worker].jobs = [];
  connectedWorkers[worker].ready = false;

  mqtt.subscribe(worker); // subscribe to the worker

  logging(chalk.yellow('Worker ('+worker+') Connected!'));
  
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
    mqttToSocketIoEE.emit('worker update', worker)
  }, 15000);
}

function getAvailableDrinks(){
  var availableDrinks = [];
  Object.keys(connectedWorkers).forEach(function(worker){
    if(connectedWorkers[worker].worker && connectedWorkers[worker].worker.cocktails){
      connectedWorkers[worker].worker.cocktails.forEach(function(cocktailKey){
        var cocktail = defs.cocktails[cocktailKey];
        cocktail.key = cocktailKey
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
var bcrypt = require('bcryptjs');
var salt = '$2a$10$.1xdj9sEqm0E9nqCh0RvmO'
var hash = '$2a$10$.1xdj9sEqm0E9nqCh0RvmOX/CTOK37l6MBkwKP9tihbHVWri/G2Pi'

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', function(req, res){
  res.sendFile(__dirname+'/views/admin.html');
});

app.get('/status', function(req, res){
  res.sendFile(__dirname+'/views/status.html');
});

app.get('/', function(req, res){
  res.sendFile(__dirname+'/views/index.html');
});

http.listen(4000, function(){
  logging(chalk.yellow('listening on *:4000'));
});

io.on('connection', function(socket){ 
  var loggedInAdmin = false; 

  setImmediate(sendQueue);
  setImmediate(sendAvailableDrinks);
  setImmediate(sendCurrentWorkers);

  socket.on('add drink to queue', function(job){
    logging(chalk.yellow('adding a drink to the queue: ') + job.cocktail.name + '. (key:'+job.cocktail.key+')' + chalk.yellow('for: ') + job.name);
    job.cocktail = job.cocktail.key;
    controller.enqueue(job)
    socket.emit('your drink', controller.queue[controller.queue.length-1]);
    mqttToSocketIoEE.emit('queue update');
    sendQueue();
  });

  socket.on('get queue', sendQueue);
  socket.on('get available drinks', sendAvailableDrinks);
  socket.on('get current workers', sendCurrentWorkers);
  socket.on('login admin', loginAdmin);
  socket.on('clean worker', cleanWorker);
  socket.on('stop worker', stopWorker);

  mqttToSocketIoEE.on('drink mixed', drinkMixed);
  mqttToSocketIoEE.on('worker update', updateWorker);
  mqttToSocketIoEE.on('queue update', sendQueue);

  function loginAdmin(credentials){
    logging(chalk.yellow('Login attempt'))

    if(credentials.name === 'NodebotAdmin'){
       if(bcrypt.compareSync(credentials.password, hash)){
        logging(chalk.yellow('An admin has logged in! yay!'))
        socket.emit('login reply', true);
        loggedInAdmin = true;
      } else socket.emit('login reply', false);
    }
    else socket.emit('login reply', false);
  }

  function stopWorker(obj){
    if(loggedInAdmin && obj.credentials.name === 'NodebotAdmin' && bcrypt.compareSync(obj.credentials.password, hash)){
      var worker = obj.stop
      console.log('worker for stopping', worker);

      if(connectedWorkers[worker]) connectedWorkers[worker].ready = true;

      mqtt.publish(worker,  JSON.stringify({status: 'stop now'}));
     
      mqttToSocketIoEE.emit('queue update');
      mqttToSocketIoEE.emit('worker update', worker)
    }
  }

  function cleanWorker(obj){
    if(loggedInAdmin && obj.credentials.name === 'NodebotAdmin' && bcrypt.compareSync(obj.credentials.password, hash)){
      var worker = obj.clean
      console.log('worker for clean', worker);

      connectedWorkers[worker].ready = false;
      connectedWorkers[worker].jobs = [{
            id: -100,
            name: 'cleaning',
            cocktail: 'clean',
            pump: 0,
            activations: [
              {drink: 'water', time: 60000}, // milleseconds
              {drink: 'water', time: 60000},
              {drink: 'water', time: 60000}
            ]
          }, {
            id: -100,
            name: 'cleaning',
            cocktail: 'clean',
            pump: 1,
            activations: [
              {drink: 'water', time: 60000}, // milleseconds
              {drink: 'water', time: 60000},
              {drink: 'water', time: 60000}
            ]
          },
        ];
  
      mqtt.publish(worker, JSON.stringify({
          status: 'new jobs', 
          jobs:[{
            id: -100,
            name: 'cleaning',
            cocktail: 'clean',
            pump: 0,
            activations: [
              {drink: 'water', time: 60000}, // milleseconds
              {drink: 'water', time: 60000},
              {drink: 'water', time: 60000}
            ]
          }, {
            id: -100,
            name: 'cleaning',
            cocktail: 'clean',
            pump: 1,
            activations: [
              {drink: 'water', time: 60000}, // milleseconds
              {drink: 'water', time: 60000},
              {drink: 'water', time: 60000}
            ]
          },
        ] 
        })
      );
      mqttToSocketIoEE.emit('queue update');
      mqttToSocketIoEE.emit('worker update', worker)
      {
      
    }
    }
  }

  function drinkMixed(obj){
    updateWorker(obj.worker);

    socket.emit('drinks served', drinksServed);
    socket.emit('notification', {heading: 'Drink Ready!', message: obj.message, finishedJob: obj.finishedJob});
  }

  function updateWorker(worker){
    if(!connectedWorkers[worker]){
      return sendCurrentWorkers();
    }

    var workaholic = sendWorker(worker);
    console.log(workaholic);
    socket.emit('update worker', workaholic);
  };

  function sendQueue(){
    socket.emit('drinks served', drinksServed);

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

