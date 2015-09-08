var socket = io();

var helloApp = angular.module("helloApp", ['ui']);

helloApp.controller("MixerCtrl", function($scope, $http) {

	$scope.notifications = [];
	$scope.queue = [];
	$scope.job = {};
	$scope.drinks = [];
	$scope.workers = [];
	$scope.drinksServed = 0;
	$scope.yourDrinks = [];

	$scope.sendJob = function(){
		console.log('job');
		console.log($scope.job);
		if($scope.job.name !== '' && $scope.job.cocktail){
			socket.emit('add drink to queue', $scope.job);
			$scope.job.name = '';
		} else {
			$scope.job.problem = 'Something went wrong';

		  setTimeout(function(){delete $scope.job.problem;}, 10000);
		}
	}

	socket.on('current queue', function(queue){
		console.log('queue:', queue);
		$scope.queue = queue;
		$scope.$apply()
	});

	socket.on('your drink', function(drink){
		console.log(drink);
		$scope.yourDrinks.push(drink);
		$scope.$apply()
	})

	socket.on('delete drink', function(drink){
		$scope.yourDrinks.forEach(function(aDrink, i){
			if(drink == aDrink) {
				$scope.yourDrinks.splice(i, 1);
			}
		});
		socket.emit('delete');
		$scope.$apply()
	})

	socket.on('available drinks', function(drinks){
		if(!$scope.job.cocktail && drinks.length) $scope.job.cocktail = drinks[0].key
		console.log('drinks:', drinks);
		$scope.drinks = drinks;
		if(!$scope.job.cocktail)$scope.job.cocktail = $scope.drinks[0];
		$scope.$apply();
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
		} else {
			$scope.workers.push(worker);
			socket.emit('get available drinks')
		}
		$scope.$apply();
	});

	socket.on('drinks served', function(num){
		$scope.drinksServed = num;
		$scope.$apply();
	});

	function addNotification(notif){
		if(notif.message.finishedJob){

		}
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