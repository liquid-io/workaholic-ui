var mqtt = require('mqtt').connect('mqtt://localhost:2048');

mqtt.on('connect', function() {
    mqtt.publish('hal', JSON.stringify({status:'button pressed'}));
      mqtt.end();
})

