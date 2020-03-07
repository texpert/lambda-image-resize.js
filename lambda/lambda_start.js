const lambdaLocal = require('lambda-local'),
      fs = require("fs"),
      jsonPayload = JSON.parse(fs.readFileSync('../event.json'));

lambdaLocal.execute({
  event: jsonPayload,
  lambdaPath: 'index.js',
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
