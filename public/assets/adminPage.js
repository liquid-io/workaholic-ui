var socket = io();

var helloApp = angular.module("helloApp", ['ui']);

helloApp.controller("AdminCtrl", function($scope, $http) {

	$scope.notifications = [];
	$scope.queue = [];
	$scope.job = {};
	$scope.drinks = [];
	$scope.workers = [];
	$scope.drinksServed = 0;
	$scope.loggedIn = false;
	$scope.credentials = {};
	$scope.retryLogin = true;

	socket.on('reconnect', function(){
		if($scope.loggedIn) socket.emit('login admin', $scope.credentials);
	})

	$scope.clean = function(worker){
		socket.emit('clean worker', {credentials: $scope.credentials, clean: worker.name});
	}

	$scope.stop = function(worker){
		socket.emit('stop worker', {credentials: $scope.credentials, stop: worker.name});
	}


	$scope.login = function(){
		if($scope.credentials.name && $scope.credentials.password && $scope.retryLogin){
			socket.emit('login admin', $scope.credentials);
		} else {
			$scope.credentials.problem = 'unsuccessful login attempt. wait 10 secs before trying again.'
			$scope.retryLogin = false

		  setTimeout(function(){
		  	delete $scope.credentials.problem; 
		  	$scope.retryLogin = true;
		  }, 10000);
		}
	}

	$scope.sendJob = function(){
		if($scope.job.name !== '' && $scope.job.cocktail){
			socket.emit('add drink to queue', $scope.job);
			$scope.job.name = '';
		} else {
			$scope.job.problem = 'Something went wrong';

		  setTimeout(function(){delete $scope.job.problem;}, 10000);
		}
	}

	socket.on('login reply', function(success){
	  $scope.loggedIn = success;
	  if(!success){
			$scope.credentials.password = '';
			$scope.credentials.problem = 'unsuccessful login attempt. wait 10 secs before trying again.'
			$scope.retryLogin = false

		  setTimeout(function(){
		  	delete $scope.credentials.problem; 
		  	$scope.retryLogin = true;
		  }, 10000);
	  }
		$scope.$apply()
	})

	socket.on('current queue', function(queue){
		console.log('queue:', queue);
		$scope.queue = queue;
		$scope.$apply()
	});

	socket.on('available drinks', function(drinks){
		$scope.drinks = drinks;
		$scope.$apply()
	})

	socket.on('current work', function(currWork){
		console.log('Current work:', currWork);
		$scope.currWork = currWork;
		$scope.$apply();
	})

	socket.on('notification', addNotification);

	socket.on('current workers', function (workers){
		$scope.workers = workers;
		$scope.$apply();
	})

	socket.on('update worker', function (worker){
		var workerIndex = -1;

		$scope.workers.forEach(function (workaholic, index){
			if(workaholic.name === worker.name){
				workerIndex = index;
			}
		});
		if(workerIndex > -1){
			$scope.workers[workerIndex] = worker;
		  $scope.$apply();
		} else {
			$scope.workers.push(worker);
		  $scope.$apply();
		}
	});

	socket.on('drinks served', function(num){
		$scope.drinksServed = num;
		$scope.$apply();
	})

	function addNotification(notif){
		$scope.notifications.push({heading: notif.heading, message: notif.message});
		$scope.$apply()

		setTimeout(function(){
			var index = 0;
			$scope.notifications.forEach(function notif(notification, i){
				if(notification == notif) index = i;
			})
			$scope.notifications.splice(index, 1);
		  $scope.$apply()
		}, 10000);
	}

	setInterval(function(){
		socket.emit('get queue');
	}, 10000);
});

helloApp.filter('worker_ready', function() {
  return function(ready) {
  	if(ready) return 'yes';
  	return 'no'
	}
});