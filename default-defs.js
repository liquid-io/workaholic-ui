module.exports = {
	workers: {
    pi1: {
      cocktails: ['debug', 'debug'] //cocktails a worker can make
    },
    pi2: {
      cocktails: ['vodka', 'spritz']
    }
  },
  cocktails: {
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
	  },
	  crazy: {
	    activations: [
	      {drink: 'whiskey', time: 60000}, // milleseconds
	      {drink: 'pineapple', time: 60000},
	      {drink: 'coke', time: 160000}
	    ]
	  },
	  debug: {
	  	activations: [
	      {drink: 'debug', time: 5000}, // milleseconds
	      {drink: 'debug', time: 5000},
	      {drink: 'debug', time: 5000}
	    ]
	  }
	}
}