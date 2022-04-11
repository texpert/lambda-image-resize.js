'use strict';

const AWS = require('aws-sdk/global'),
      AWS_S3 = require('aws-sdk/clients/s3'),
      S3 = new AWS_S3({ signatureVersion: 'v4' }),
      Sharp = require('sharp');

exports.handler = (event, context, callback) => {
  console.log('Started event:', event);

  const { attachment, copy_original, path, storages, versions } = event,
        originalBucket = storages[attachment.storage],
        originalKey = originalBucket.prefix ? `${originalBucket.prefix}/${attachment.id}` : attachment.id,
        targetStorage = event.target_storage,
        targetBucket = storages[targetStorage];

  S3.getObject({ Bucket: originalBucket.name, Key: originalKey }).promise()
    .then(data => {
      const versionPromises = [];
      if (versions)
        for(const version of versions) {
          versionPromises.push(resizeToBucket(data, storages, path, version)
            .catch(reason => console.log(`Error on version: ${version.name}, reason: ${reason}`))
          )
        }
      if (copy_original && copy_original === true)
        versionPromises.push(bufferToBucket(data.Body, targetBucket,
                                            formPath(targetBucket.prefix, path, attachment),
                                            'original',
                                            targetStorage,
                                            attachment.metadata));
      Promise.all(versionPromises)
        .then(function(values) {
          const payload = { context: event.context };

          if (versions)
            payload.versions = values;
          else
            payload.original = values[0].original;
          sendResult(event.callbackURL, attachment.metadata.key, payload);
        })
    })
    .catch(err => callback(err));
};

function resizeToBucket(data, storages, path, version) {
  return new Promise(resolve => {
    const pipeline = Sharp(data.Body).resize(version.width, version.height),
          format = version.format,
          storage = version.storage,
          bucket = storages[storage];

    if (format)
      pipeline.toFormat(format);
    pipeline.toBuffer()
    .then((buffer) => {
      resolve(bufferToBucket(buffer, bucket, formPath(bucket.prefix, path, version), version.name, storage));
    })
  });
}

function bufferToBucket(buffer, bucket, key, version_name, storage, metadata = {}) {
  return new Promise(resolve => {
    S3.putObject({
        ACL: bucket.upload_options.acl,
        Body : buffer,
        Bucket : bucket.name,
        Key : key },
      () => {
        console.log('Buffer stored:', key);
        const prefix = bucket.prefix;

        // If the key is starting with the bucket.prefix, remove the prefix - it is a storage property
        if (key.indexOf(prefix) === 0)
          key = key.slice(prefix.length + 1);

        resolve({ [`${version_name}`]: { storage : storage, id : key, metadata : metadata } })
      }
    );
  })
}

function formPath(prefix = null, path, { format = null, name = null }) {
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

function sendResult (callbackURL, key, payload) {
  console.log('Starting PUT request to callbackURL:', callbackURL);

  const endpoint = new AWS.Endpoint(callbackURL);
  let request = new AWS.HttpRequest(endpoint);
  request.region = process.env.AWS_REGION;
  request.method = 'PUT';
  request.headers['Content-Type'] = 'application/json';
  request.headers['Host'] = endpoint.host;
  request.body = JSON.stringify(payload);

  const signer = new AWS.Signers.V4(request, process.env.AWS_LAMBDA_FUNCTION_NAME);
  signer.addAuthorization({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: key }, new Date());

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
