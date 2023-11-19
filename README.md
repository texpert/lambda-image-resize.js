# Lambda Image Resize 

## Description

An [AWS Lambda][aws_lambda] function for resizing images on demand.

Built using the [sharp][sharp] image resizing JS library, and running on the [Node.js][nodejs] runtime.

_Note: currently Sharp is being built on Node.js version 20.x_  

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

- The [AWS SAM Local][aws_sam_local] CLI tool for local development and testing.


## Usage

### Build Sharp

On Linux, the following simple command should just work:

```
$ yarn add sharp
```

On MacOS:

- for local testing use the same `yarn add sharp` command
- for deploying to AWS Lamda, Sharp should be compiled for Linux x64:

```
# SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm_config_arch=x64 npm_config_platform=linux yarn add sharp
```

### Local testing

Or, to invoke and debug locally, run the `lambda_start.js` module, which uses the [Commandline tool to run Amazon Lambda function on local machines][lambda-local]:

```
$ node test/lambda_start.js
```

Install globally the [AWS SAM Local][aws_sam_local] package.

```
$ npm install -g aws-sam-local
```

__The AWS SAM Local invokation, described below, was based on the docker package 
https://github.com/lambci/docker-lambda, which now is pretty abandoned and of no use for now.
There is a fork, if someone still need it, though it is not supported by the AWS SAM__:

To invoke the Lambda function using the [AWS SAM Local][aws_sam_local] with an [AWS credentials profile][aws_profile] 
with a event.json fixture file, run the following command:

```
$ sam local invoke "ImageResizeOnDemand" -e test/event.json --profile texpert
```

### Deploying

First, create a deploy package and upload it to a S3 bucket:

```
$ sam package --template-file template.yaml --s3-bucket texpert-test-store --s3-prefix lambda/packages --output-template-file packaged.yaml --profile texpert 
```

The created `packaged.yaml` file will contain the URL to the S3 bucket, which was specified in the 'package' command.

Then, deploy the package to [AWS CloudFormation stack][aws_cloudformation]:

```
# CAPABILITY_IAM is not a placeholder 
$ sam deploy --template-file ./packaged.yaml --stack-name lambda-test --capabilities CAPABILITY_IAM --profile texpert
```

### Grant Lambda function access to the S3 buckets:

See https://aws.amazon.com/premiumsupport/knowledge-center/lambda-execution-role-s3-bucket/ 
and https://bobbyhadz.com/blog/aws-grant-lambda-access-to-s3

Create an IAM role for the Lambda function that also grants access to the S3 bucket

1.    Follow the steps in Creating an execution role in the IAM console.
2.    From the list of IAM roles, choose the role that you just created.
3.    In the Permissions tab, choose Add inline policy.
4.    Choose the JSON tab.
5.    Enter a resource-based IAM policy that grants access to your S3 bucket

#### Example of resource based IAM Policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutAnalyticsConfiguration",
                "s3:GetObjectVersionTagging",
                "s3:CreateBucket",
                "s3:ReplicateObject",
                "s3:GetObjectAcl",
                "s3:GetBucketObjectLockConfiguration",
                "s3:DeleteBucketWebsite",
                "s3:GetIntelligentTieringConfiguration",
                "s3:PutLifecycleConfiguration",
                "s3:GetObjectVersionAcl",
                "s3:PutObjectTagging",
                "s3:DeleteObject",
                "s3:DeleteObjectTagging",
                "s3:GetBucketPolicyStatus",
                "s3:GetObjectRetention",
                "s3:GetBucketWebsite",
                "s3:PutReplicationConfiguration",
                "s3:GetObjectAttributes",
                "s3:DeleteObjectVersionTagging",
                "s3:PutObjectLegalHold",
                "s3:InitiateReplication",
                "s3:GetObjectLegalHold",
                "s3:GetBucketNotification",
                "s3:PutBucketCORS",
                "s3:GetReplicationConfiguration",
                "s3:ListMultipartUploadParts",
                "s3:PutObject",
                "s3:GetObject",
                "s3:PutBucketNotification",
                "s3:PutBucketLogging",
                "s3:PutObjectVersionAcl",
                "s3:GetAnalyticsConfiguration",
                "s3:PutBucketObjectLockConfiguration",
                "s3:GetObjectVersionForReplication",
                "s3:GetLifecycleConfiguration",
                "s3:GetInventoryConfiguration",
                "s3:GetBucketTagging",
                "s3:PutAccelerateConfiguration",
                "s3:DeleteObjectVersion",
                "s3:GetBucketLogging",
                "s3:ListBucketVersions",
                "s3:ReplicateTags",
                "s3:RestoreObject",
                "s3:ListBucket",
                "s3:GetAccelerateConfiguration",
                "s3:GetObjectVersionAttributes",
                "s3:GetBucketPolicy",
                "s3:PutEncryptionConfiguration",
                "s3:GetEncryptionConfiguration",
                "s3:GetObjectVersionTorrent",
                "s3:AbortMultipartUpload",
                "s3:PutBucketTagging",
                "s3:GetBucketRequestPayment",
                "s3:GetObjectTagging",
                "s3:GetMetricsConfiguration",
                "s3:GetBucketOwnershipControls",
                "s3:DeleteBucket",
                "s3:PutBucketVersioning",
                "s3:PutObjectAcl",
                "s3:GetBucketPublicAccessBlock",
                "s3:ListBucketMultipartUploads",
                "s3:PutIntelligentTieringConfiguration",
                "s3:PutMetricsConfiguration",
                "s3:PutBucketOwnershipControls",
                "s3:PutObjectVersionTagging",
                "s3:GetBucketVersioning",
                "s3:GetBucketAcl",
                "s3:PutInventoryConfiguration",
                "s3:GetObjectTorrent",
                "s3:PutBucketWebsite",
                "s3:PutBucketRequestPayment",
                "s3:PutObjectRetention",
                "s3:GetBucketCORS",
                "s3:GetBucketLocation",
                "s3:ReplicateDelete",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::texpert-test-cache",
                "arn:aws:s3:::texpert-test-store",
                "arn:aws:s3:::texpert-test-store/*",
                "arn:aws:s3:::texpert-test-cache/*"
            ]
        }
    ]
}
```

## License

This [AWS Lambda][aws_lambda] function is [licensed][license] under Apache 2.0.


[aws_cloudformation]: https://aws.amazon.com/cloudformation/
[aws_lambda]: https://aws.amazon.com/lambda/
[aws_profile]: https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html
[aws_sam_local]: https://github.com/awslabs/aws-sam-local#package-and-deploy-to-lambda
[lambda-local]: https://github.com/ashiina/lambda-local
[license]: LICENSE
[nodejs]: https://nodejs.org/en/
[sharp]: https://github.com/lovell/sharp