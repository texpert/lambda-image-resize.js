'use strict';

const AWS = require("aws-sdk"),
      S3 = new AWS.S3({ signatureVersion: 'v4' }),
      Sharp = require('sharp');

exports.handler = (event, context, callback) => {
  const { callbackURL, original, path, storages, versions } = event;
  console.log('Original:', original);
  console.log('Storages:', storages);
  console.log('Versions:', versions);
  const originalBucket = findBucket(storages, original.storage);
  const originalKey = originalBucket.prefix ? `${originalBucket.prefix}/${original.id}` : original.id;
  const originalTargetBucket = findBucket(storages, original.targetStorage);

  S3.getObject({ Bucket: originalBucket.name, Key: originalKey }).promise()
    .then(
      callback(null, { statusCode: '200', body: { 'Message': 'Lambda started' } })
    )
    .then(data => {
      const versionPromises = [];
      for(const version of versions) {
        versionPromises.push(resizeToBucket(data, findBucket(storages, version.storage), path, version)
          .catch(reason => console.log(`Error on version: ${version.name}, reason: ${reason}`))
        )
      }
      versionPromises.push(bufferToBucket(data.Body, originalTargetBucket.name,
        formPath(originalTargetBucket, path, original), 'original'));
      Promise.all(versionPromises)
        .then(function(values) {
          sendResult(callbackURL, values);
        })
    })
    .catch(err => callback(err));
};

function findBucket(storages, storageName) {
  return (storages.find(obj => storageName in obj))[storageName];
}

function resizeToBucket(data, bucket, path, version) {
  return new Promise(resolve => {
    const pipeline = Sharp(data.Body).resize(version.width, version.height);
    const format = version.format;
    if (format)
      pipeline.toFormat(format);
    pipeline.toBuffer()
    .then((buffer) => {
      resolve(bufferToBucket(buffer, bucket.name, formPath(bucket, path, version), version.name));
    })
  });
}

function bufferToBucket(buffer, bucket, id, name) {
  return new Promise(resolve => {
    S3.putObject({
        Body : buffer,
        Bucket : bucket,
        Key : id },
      () => { console.log('Buffer stored:', id);
              resolve({ [`${name}`]: { store : bucket, id : id } }) }
    );
  })
}

function formPath({ prefix = null }, path, { format = null, id = null, name = null }) {
  let result = prefix ? `${prefix}/${path}` : path;
  if (name) {
    result = result.split('/');
    const lastElementIndex = result.length - 1;
    let filename = `${name}-${result[lastElementIndex]}`;
    if (format)
      filename = `${filename}.${format}`;
    result[lastElementIndex] = filename;
    result = result.join('/');
  }
  return result;
}

function sendResult (callbackURL, payload) {
  console.log('Starting PUT request to callbackURL:', callbackURL);

  const endpoint = new AWS.Endpoint(callbackURL);
  let request = new AWS.HttpRequest(endpoint);
  request.region = process.env.AWS_REGION;
  request.method = 'PUT';
  request.headers['Content-Type'] = 'application/json';
  request.headers['presigned-expires'] = 'false';
  request.headers['Host'] = endpoint.host;
  request.body = JSON.stringify(payload);

  const signer = new AWS.Signers.V4(request, process.env.AWS_LAMBDA_FUNCTION_NAME);
  signer.addAuthorization(AWS.config.credentials, new Date());

  console.log('Request:', request);

  const send = new AWS.NodeHttpClient();
  send.handleRequest(request, null, response => {
    let respBody = '';
    response.on('data', chunk => { respBody += chunk; });
    response.on('end', () => { console.log('RESPONSE: ', respBody); });
  }, err => {
    console.log(`Error: ${err}`);
  });
}
