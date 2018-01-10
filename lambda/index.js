'use strict';

const AWS_S3 = require('aws-sdk/clients/s3');
const S3 = new AWS_S3({ signatureVersion: 'v4' });
const Sharp = require('sharp');

exports.handler = function(event, context, callback) {
  const { callbackURL, original, path, storages, versions } = event;
  console.log('Original:', original);
  console.log('Storages:', storages);
  console.log('Versions:', versions);
  const originalBucket = findBucket(storages, original.storage);
  const originalKey = originalBucket.prefix ? `${originalBucket.prefix}/${original.id}` : original.id;

  callback(null, { statusCode: '200', body: { 'Message': 'Lambda started' } });


  S3.getObject({ Bucket: originalBucket.name, Key: originalKey }).promise()
    .then(function (data) {
      const versionPromises = [];
      for(const version of versions) {
        versionPromises.push(resizeToBucket(data, storages, path, version)
          .catch(reason => console.log(`Error on version: ${version.name}, reason: ${reason}`))
        )
      }
      Promise.all(versionPromises)
             .then(function(values) {
               console.log('values:', values);
             })
    })
    .catch(err => callback(err));
};

function findBucket(storages, storageName) {
  return (storages.find(function (obj) { return storageName in obj }))[storageName];
}

function resizeToBucket(data, storages, path, version) {
  return new Promise(function(resolve) {
    const versionBucket = findBucket(storages, version.storage);
    Sharp(data.Body)
      .resize(version.width, version.height)
      .toFormat(version.format)
      .toBuffer()
      .then((buffer) => {
        let versionKey = versionBucket.prefix ? `${versionBucket.prefix}/${path}` : path;
        versionKey = versionKey.split('/');
        const lastElementIndex = versionKey.length - 1;
        versionKey[lastElementIndex] = `${version.name}-${versionKey[lastElementIndex]}.${version.format}`;
        versionKey = versionKey.join('/');
        S3.putObject({ Body : buffer,
                       Bucket : versionBucket.name,
                       Key : versionKey },
          () => { version.key = versionKey;
                   console.log('Image processed:', version.name);
                   resolve(version); }
        );
      })
  });
}
