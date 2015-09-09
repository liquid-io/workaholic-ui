module.exports = {
	workers: {
    green: {
      cocktails: [{cocktail: 'seabreeze', pump: 0}, {cocktail: 'moscowMule', pump: 1}] //cocktails a worker can make
    },
    red: {
      cocktails: [{cocktail: 'rumAndCoke', pump: 0}, {cocktail: 'darkAndStormy', pump: 1}] //cocktails a worker can make
    },
    yellow: {
      cocktails: [{cocktail: 'crazyWolf', pump: 0}, {cocktail: 'whiskeySour', pump: 1}] //cocktails a worker can make
    },
    julian: {
      cocktails: [{cocktail: 'promises', pump: 0}, {cocktail: 'rumAndCoke', pump: 1}] //cocktails a worker can make
    }
  },
  cocktails: {
	  darkAndStormy: {
	  	name: 'Dark and Stormy',
	    activations: [
	      {drink: 'ginger beer', time: 120000}, // milleseconds
	      {drink: 'rum', time: 40000},
	      {drink: 'lime', time: 20000}
	    ]
	  },
	  rumAndCoke: {
	  	name: 'Rum and Coke',
	    activations: [
	      {drink: 'coke', time: 60000}, // milleseconds
	      {drink: 'rum', time: 20000},
	      {drink: 'coke', time: 60000}
	    ]
	  },
	  moscowMule: {
	  	name: 'Moscow Mule',
	    activations: [
	      {drink: 'vodka', time: 60000}, // milleseconds
	      {drink: 'lime', time: 10000},
	      {drink: 'ginger beer', time: 120000}
	    ]
	  },
	  seabreeze: {
	  	name: 'Seabreeze',
	    activations: [
	      {drink: 'vodka', time: 60000}, // milleseconds
	      {drink: 'cranberry', time: 60000},
	      {drink: 'pineapple', time: 120000}
	    ]
	  },
	  whiskeySour: {
	  	name: 'Whiskey Sour',
	    activations: [
	      {drink: 'whiskey', time: 60000}, // milleseconds
	      {drink: 'lemon juice', time: 60000},
	      {drink: 'gomme syrup', time: 70000}
	    ]
	  },
	  crazyWolf: {
	  	name: 'Crazy Wolf',
	    activations: [
	      {drink: 'whiskey', time: 30000}, // milleseconds
	      {drink: 'peach schnapps', time: 30000},
	      {drink: 'pinapple', time: 120000}
	    ]
	  },
	  callbackHell: {
	  	name: 'Callback Hell',
	    activations: [
	      {drink: 'whiskey', time: 40000}, // milleseconds
	      {drink: 'coke', time: 90000},
	      {drink: 'cranberry juice', time: 40000}
	    ]
	  },
	  promises: {
	  	name: 'Promises',
	    activations: [
	      {drink: 'whiskey', time: 40000}, // milleseconds
	      {drink: 'coke', time: 90000},
	      {drink: 'pineapple juice', time: 50000}
	    ]
	  },
	}
}
