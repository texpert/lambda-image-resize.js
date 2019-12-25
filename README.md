# Lambda Image Resize 

## Description

An [AWS Lambda][aws_lambda] function for resizing images on demand.

Built using the [sharp][sharp] image resizing JS library, and running on the [Node.js][nodejs] runtime.

_Note: currently Sharp is being built on Node.js version 10.x_  

On invocation, the Lambda function will fetch the image from the 'original' S3 bucket, resize the image, upload both 
the original and the resized image to the target S3 bucket, and return the resulting filenames to a specified 
CallbackURL. 

It is possible to pass via the function `event` param several versions of the image to be created and, also, several 
S3 buckets to store the images into.


## Prerequisites

AWS credentials and config files with a `default` or [named profile][aws_profile], which should be located in the `~/
.aws` folder.

You should have the following packages locally installed:

- Docker;
- Python 3.xx and pip3 (the latter is installed along with the former);
- AWS CLI: run `$ pip3 install awscli --upgrade --user` to install it;
    - Mac OS note: `~/Library/Python/3.xx/bin` folder should be added to the path for `aws` to be find from the CLI

- The [sharp][sharp] image resizing library;

  To install the [sharp][sharp] library into the `lambda` folder, run in the repository root folder:

    ```
    $ docker run -v "$PWD":/var/task lambci/lambda:build-nodejs10.x npm install --prefix=lambda
    ```

- The [AWS SAM Local][aws_sam_local] CLI tool for local development and testing.


## Usage

### Local testing

First, install globally the [AWS SAM Local][aws_sam_local] package.

```
$ npm install -g aws-sam-local
```

To invoke the Lambda function using the [AWS SAM Local][aws_sam_local] with an [AWS credentials profile][aws_profile] 
with a event.json fixture file, run the following command:

```
$ sam local invoke "ImageResizeOnDemand" -e event.json --profile texpert
```


### Deploying

First, create a deploy package and upload it to a S3 bucket:

```
$ sam package --template-file template.yaml --s3-bucket texpert-test-store --s3-prefix lambda/packages 
--output-template-file packaged.yaml
```

The created `packaged.yaml` file will contain the URL to the S3 bucket, which was specified in the 'package' command.

Then, deploy the package to an [AWS CloudFormation stack][aws_cloudformation]:

```
$ sam deploy --template-file ./packaged.yaml --stack-name lambda-test --capabilities CAPABILITY_IAM
```

## License

This [AWS Lambda][aws_lambda] function is [licensed][license] under Apache 2.0.


[aws_cloudformation]: https://aws.amazon.com/cloudformation/
[aws_lambda]: https://aws.amazon.com/lambda/
[aws_profile]: https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html
[aws_sam_local]: https://github.com/awslabs/aws-sam-local#package-and-deploy-to-lambda
[license]: LICENSE
[nodejs]: https://nodejs.org/en/
[sharp]: https://github.com/lovell/sharp
