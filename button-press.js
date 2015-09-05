var mqtt = require('mqtt').connect('mqtt://localhost:2048');

mqtt.on('connect', function() {
    mqtt.publish('pi1', JSON.stringify({status:'button pressed'}));
      mqtt.end();
})

