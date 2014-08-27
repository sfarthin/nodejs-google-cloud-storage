# Google Cloud Storage Signed URLs for Node.js

I created this NPM module so that I can create web apps that allow users to upload directly to Google Cloud Storage. Using <a href="https://developers.google.com/storage/docs/accesscontrol#Signed-URLs" target="_blank">Signed URLs</a> I am able to control access with Node.js and a private key. Because there is not a Node.js SDK for Google Cloud Storage, the cryptographic signatures were coded using Node.js's crypto module to Google's specification. This integration alleviates much of the maintenance required in storing and handing file uploads in web apps while at the same time not complicating the uploading process by acting as a middleman between the user and Google Cloud Storage.

 **NOTE:** you need to create a google service account.

Simple example: [http://ancient-anchorage-2534.herokuapp.com/](http://ancient-anchorage-2534.herokuapp.com/).

For more advanced examples with xhr uploads, see [https://github.com/sfarthin/crop-rotate-and-sample-in-browser](https://github.com/sfarthin/crop-rotate-and-sample-in-browser).

## Setup

	npm install gcs-signed-urls

#### Creating a Service Account
1. Visit the [Google Developer Console](https://console.developers.google.com/)
2. Click credentials
3. Create new client ID
4. Create a service account

#### Incorperate service account.
5. After you create a service account you should recieve a .p12 file. Convert the .p12 (key and certificate in one) to an ascii formatted .pem which can be read as text. Use this command:

	openssl pkcs12 -in *.p12 -out google-services-private-key.pem -nodes -clcerts

6. The password is always "notasecret"
7. Your all set! Now you will be able to run the [example app](https://github.com/sfarthin/nodejs-google-cloud-storage/blob/master/example/app.js).


## Reference

First create your CloudStorage instance with your gcs information.

	var CloudStorage = require("gcs-signed-urls")("*****@developer.gserviceaccount.com", "my_bucket_name", "/path/to/google-services-private-key.pem")

You can also store gcs information in environment variables so you do not need to specify it in your application.

	var CloudStorage = require("gcs-signed-urls")()

Set variables like this:

	$ export GOOGLE_SERICES_EMAIL=*****@developer.gserviceaccount.com
	$ export GCS_STORAGE_BUCKET=my-bucket
	$ export GCS_PRIVATE_KEY=`cat path/to/google-services-private-key.pem`

### uploadRequest(filename, key, isAttachment, customFields)
This method creates an object representing the fields of an HTML form.

**filename** - Filename given to the file uploaded. Mime type is determined given the extension.

**key** - The Google Cloud key.

**isAttachment** - This sets content disposition to be an attachment, causing the browser to download the file (with the given filename) rather than show the file inside the browser.

**customFields** - Set custom "x-goog-meta-" headers.

	<form action="http://my_bucket.storage.googleapis.com" method="post" enctype="multipart/form-data">
		<input type="text" name="key" value="<%=key%>">
		<input type="hidden" name="bucket" value="my_bucket">
		<input type="hidden" name="GoogleAccessId" value="*****@developer.gserviceaccount.com">
		<input type="hidden" name="policy" value="<%=fields.policy%>">
		<input type="hidden" name="signature" value="<%=fields.signature%>">

		<input name="file" type="file">
		<input type="submit" value="Upload">
	</form>

### upload(filename, key, isAttachment, customFields, callback)
Direct upload from Node.js using the same options as uploadRequest.

### defaultAcl: function(acl, callback)
Takes an acl option and sets that as the default acl of an object. The options are:
project-private
private
public-read
public-read-write
authenticated-read
bucket-owner-read
bucket-owner-full-control

See https://developers.google.com/storage/docs/accesscontrol#extension

### cors: function(xml, callback)
Sets the  xml cors policy

### exisits: function(key, callback)
### metaData: function(key, callback)
### makePrivate: function(key, callback)
### makePublic: function(key, callback)
### getPublicUrl: function(key)
### getPrivateUrl: function(key)
### remove: function(key, callback)

## Running tests or example

The tests and example require environoment variables to be set.
	
	$ export GOOGLE_SERICES_EMAIL=*****@developer.gserviceaccount.com
	$ export GCS_STORAGE_BUCKET=my-bucket
	$ export GCS_PRIVATE_KEY=`cat path/to/google-services-private-key.pem`
	
To run test

	npm test

To run example on port 3001

	npm start
