# Nodejs Google Cloud Storage using Signed Urls.

Allow uploads directly from the browser to Google Cloud Storage while controlling access with Nodejs and signed urls. **NOTE:** you need to create a google service account.

Simple example: [http://ancient-anchorage-2534.herokuapp.com/](http://ancient-anchorage-2534.herokuapp.com/).

For more advanced examples with xhr uploads, see [https://github.com/sfarthin/crop-rotate-and-sample-in-browser](https://github.com/sfarthin/crop-rotate-and-sample-in-browser).

## Setup
#### Creating a Service Account
1. Visit the [Google Developer Console](https://console.developers.google.com/)
2. Click credentials
3. Create new client ID
4. Create a service account
#### Incorperate service account.
5. After you create a service account you should recieve a .p12 file. Convert the .p12 (key and certificate in one) to an ascii formatted .pem which can be read as text. Use this command:

	openssl pkcs12 -in *.p12 -out google-services-private-key.pem -nodes -clcerts

6. The password is always "notasecret"
7. Now you can use this library

	CloudStorage = require("gcs-signed-urls")("*****@developer.gserviceaccount.com", "my_bucket_name", "/path/to/google-services-private-key.pem")
	
	// Upload directly
	CloudStorage.upload("/path/to/file", "my_gcs_key");
	
	// generate form fields to allow upload from HTML form
	var formFields = CloudStorage.uploadRequest("somefilename.txt", "my_gcs_key2")


See an example with (xhr upload and image manipulation)[https://github.com/sfarthin/crop-rotate-and-sample-in-browser].


## Reference

First create your cloudStorage object with your google information.

	var CloudStorage = require("gcs-signed-urls")("*****@developer.gserviceaccount.com", "my_bucket_name", "/path/to/google-services-private-key.pem")

##### uploadRequest(filename, key, isAttachment, customFields)
This method is used to create a form for the user to upload to Google Cloud Storage. After running uploadRequest, it expires in one hour. It returns an object where each item represents a form input.
**filename** - Filename given to the file uploaded. Mime type is determined given the extension.
**key** - The Google cloud key.
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

##### upload(filename, key, isAttachment, customFields, callback)
Direct upload from Node.js using the same options as uploadRequest.

##### defaultAcl: function(acl, callback)
Takes an acl option and sets that as the default acl of an object. The options are:
project-private
private
public-read
public-read-write
authenticated-read
bucket-owner-read
bucket-owner-full-control

See https://developers.google.com/storage/docs/accesscontrol#extension

##### cors: function(xml, callback)
Sets the  xml cors policy

##### exisits: function(key, callback)
###### metaData: function(key, callback)
##### makePrivate: function(key, callback)
##### makePublic: function(key, callback)
##### getPublicUrl: function(key)
##### getPrivateUrl: function(key)
##### remove: function(key, callback)

## Running tests or example

Create config.js in the root.
	
	module.exports = {
		"storageBucket": 	"google-storage-bucket-name",
		"servicesEmail": 	"*******@developer.gserviceaccount.com",
		"privateKey": 		"/path/to/google-services.pem"
	};
	
To run test

	npm test
	
To run example on port 3001

	npm start