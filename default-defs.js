module.exports = {
	workers: {
    sherlock: {
      cocktails: ['seabreeze', 'seabreeze'] //cocktails a worker can make
    },hal: {
      cocktails: ['dara2', 'dara1'] //cocktails a worker can make
    },pi1: {
      cocktails: ['seabreeze', 'seabreeze'] //cocktails a worker can make
    },pi1: {
      cocktails: ['seabreeze', 'seabreeze'] //cocktails a worker can make
    },
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
	      {drink: 'coke', time: 60000},
	      {drink: 'rum', time: 20000}
	    ]
	  },
	  moscowMule: {
	  	name: 'Moscow Mule',
	    activations: [
	      {drink: 'vodka', time: 30000}, // milleseconds
	      {drink: 'lime', time: 15000},
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
	      {drink: 'whiskey', time: 30000}, // milleseconds
	      {drink: 'lemon juice', time: 30000},
	      {drink: 'gomme syrup', time: 15000}
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
	  dara1: {
	  	name: 'Darragh 1',
	    activations: [
	      {drink: 'coke', time: 60000}, // milleseconds
	      {drink: 'rum', time: 50000},
	      {drink: 'coke', time: 60000}
	    ]
	  },
	  dara2: {
	  	name: 'Darragh 2',
	    activations: [
	      {drink: 'coke', time: 200000}, // milleseconds
	      {drink: 'whiskey', time: 40000},
	      {drink: 'cranberry', time: 40000}
	    ]
	  }
	}
}