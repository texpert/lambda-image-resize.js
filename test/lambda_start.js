const lambdaLocal = require('lambda-local'),
      fs = require("fs"),
      path = require('path'),
      jsonPayload = JSON.parse(fs.readFileSync('test/event.json'));

lambdaLocal.execute({
  event: jsonPayload,
  lambdaPath: path.join('index.js'),
  profilePath: '~/.aws/credentials',
  profileName: 'texpert',
  timeoutMs: 30000,
  callback: function(err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  }
});
