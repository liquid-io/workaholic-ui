#The Workaholic UI

This repo contains the code for the ui for the cocktail robots which were demo'd at NodeConfEu 2015. Built by @thekemkid, @darragh-hayes, @mcollina and @juliancheal.

The main code is in index.js. This file contains the mqtt handling logic, the client logic and the communication emmiter between that logic.

Some terms used in this readme:
- A *worker* is a piece of hardware (we used the pi2) that runs the robot code and communicates with the server to get jobs, typically setup with two machines.
- A *machine* is an array of pumps which takes in the mixers and outputs into one glass/cup/cocktail.
- A *job* is a set of instructions to be sent to the worker to tell it how to run each pump. It is a recipe for success (also cocktails).
- A *cocktail* is a delicious beverage best served in a stress free environment, but have been known to make stressful situations better.

The mqtt handler routes messages into functions which are in the mqtt.on('message' cb); callback. These functions handle messages on the connections topic, and topics for the connected workers. All of the workers emit messages on the connections topic to ping the server. Every worker has a name, and that worker will listen on a topic with the same name. When a server recieves a ping from a configured worker, it will start listening to that workers messages, and send it relevant information/jobs.

The server also sends realtime info to the client ui using socket.io. The server sends messages on a worker connection, a worker disconnection, a worker status change (ready/not ready), a job added to the queue and when a worker finishes a job. The ui uses angular and bootstrap.

##Contributing:
All contributions are welcome.

## License

MIT
