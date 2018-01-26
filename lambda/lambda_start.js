const lambdaLocal = require('lambda-local'),
      fs = require("fs"),
      jsonPayload = JSON.parse(fs.readFileSync('../../event_pc.json'));

lambdaLocal.execute({
  event: jsonPayload,
  lambdaPath: 'index.js',
  profilePath: '~/.aws/credentials',
  profileName: 'default',
  timeoutMs: 3000,
  callback: function(err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  }
});
