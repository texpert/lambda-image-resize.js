# Lambda Image Resize 

## Description

Resize images using Amazon S3, AWS Lambda, and [sharp][sharp].  

On invocation, the Lambda function will resize the image, upload it to S3, and return the result to a specified 
CallbackURL. 

It is possible to pass via the function `event` param several versions of the image to be created and, also, several S3 buckets to store the images.

## Prerequisites

To install the Sharp lib into the `lambda` folder:

```
docker run -v "$PWD":/var/task lambci/lambda:build-nodejs6.10 npm install --prefix=lambda
```

## Usage

### Local testing

To invoke the function using AWS SAM Local with an AWS credentials profile, defined in `~/.aws/credentials` with a event.json fixture file:

```
sam local invoke "ImageResizeOnDemand" -e event.json -profile texpert
```

[sharp]: https://github.com/lovell/sharp
