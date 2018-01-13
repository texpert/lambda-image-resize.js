'use strict';

const AWS_S3 = require('aws-sdk/clients/s3');
const S3 = new AWS_S3({ signatureVersion: 'v4' });
const Sharp = require('sharp');
const https = require('https');

exports.handler = function(event, context, callback) {
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
    .then(function (data) {
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
          console.log('values:', values);
          console.log('callbackURL:', callbackURL);

          const req = https.request(callbackURL, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
              process.stdout.write(d);
            });
          });

          req.on('error', (e) => {
            console.log(`problem with request: ${e.message}`);
          });

          req.write(JSON.stringify(values));
          req.end();
        })
    })
    .catch(err => callback(err));
};

function findBucket(storages, storageName) {
  return (storages.find(function (obj) { return storageName in obj }))[storageName];
}

function resizeToBucket(data, bucket, path, version) {
  return new Promise(function(resolve) {
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
  return new Promise(function(resolve) {
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
