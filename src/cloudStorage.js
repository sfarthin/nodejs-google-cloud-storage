/**
*
* @class CloudStorage
* @module Node
**/

// http://stackoverflow.com/questions/20754279/creating-signed-urls-for-google-cloud-storage-using-nodejs

var rest 		= require("restler"),
	moment 		= require("moment"),
	fs 			= require("fs"),
	crypto 		= require("crypto"),
	mime 		= require("mime"),
	pathLib 	= require("path"),
	_ 			= require("underscore");
	
module.exports = function(googleServicesEmail, storageBucket, pathToKey) {
	
	var privateKey = fs.readFileSync(pathToKey,"utf8");
	
	return CloudStorage = {

		/**
		* @method defaultAcl
		*
		* @param acl string See below
		* 
		* https://developers.google.com/storage/docs/accesscontrol#extension
		* project-private			Gives permission to the project team based on their roles. Anyone who is part of the team has READ permission and project owners and project editors have FULL_CONTROL permission. This is the default ACL for newly created buckets. This is also the default ACL for newly created objects unless the default object ACL for that bucket has been changed.
		* private					Gives the bucket or object owner FULL_CONTROL permission for a bucket or object.
		* public-read				Gives the bucket or object owner FULL_CONTROL permission and gives all anonymous users READ permission. When you apply this to an object, anyone on the Internet can read the object without authenticating. When you apply this to a bucket, anyone on the Internet can list objects without authenticating. Important: By default, publicly readable objects are served with a Cache-Control header allowing such objects to be cached for 3600 seconds. If you need to ensure that updates become visible immediately, you should set a Cache-Control header of "Cache-Control:private, max-age=0, no-transform" on such objects. For help doing this, see the gsutil setmeta command.
		* public-read-write			Gives the bucket owner FULL_CONTROL permission and gives all anonymous users READ and WRITE permission. This ACL applies only to buckets. When you apply this to a bucket, anyone on the Internet can list, create, overwrite and delete objects without authenticating.
		* authenticated-read		Gives the bucket or object owner FULL_CONTROL permission and gives all authenticated Google account holders READ permission.
		* bucket-owner-read			Gives the object owner FULL_CONTROL permission and gives the bucket owner READ permission. This is used only with objects.
		* bucket-owner-full-control Gives the bucket owner FULL_CONTROL permission. This is used only with objects.
		**/	
		//
		defaultAcl: function(acl, callback) {
		
			var 
				// This url should expire in one hour
				expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
				// Lets put together our policy
				stringPolicy = "PUT\n" + "\n" + "\n" + expiry + "\n" + "x-goog-acl:"+acl+"\n" + '/'+storageBucket+'/?defaultObjectAcl',
			
				// create signature and make it url safe
				signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

				// signed url
				url = "https://" + storageBucket + ".storage.googleapis.com/?defaultObjectAcl&GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
		
			rest.put(url, {
				headers: {
					"x-goog-acl": acl
				}
			}).on("complete", function(err, res) {
				if(callback) callback();
			});
			
		},

		/**
		* Setup Cors 
		* @method cors
		**/	
		cors: function(xml, callback) {
		
			var 
				// This url should expire in one hour
				expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
				// Lets put together our policy
				stringPolicy = "PUT\n" + "\n" + "\n" + expiry + "\n" + '/'+storageBucket+'/?cors',
			
				// create signature and make it url safe
				signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

				// signed url
				url = "https://" + storageBucket + ".storage.googleapis.com/?cors&GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
		
			rest.put(url, {
				data: xml
			}).on("complete", function(err, res) {
				if(callback) callback();
			});
			
		},
	
		/**
		* Get Cors 
		* @method getCors
		**/	
		getCors: function() {
		
			var 
				// This url should expire in one hour
				expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
				// Lets put together our policy
				stringPolicy = "GET\n" + "\n" + "\n" + expiry + "\n" + '/'+storageBucket+'/?cors',
			
				// create signature and make it url safe
				signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

				// signed url
				url = "https://" + storageBucket + ".storage.googleapis.com/?cors&GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
		
			rest.get(url).on("complete", function(err, res) {
				console.log(res.rawEncoded);
			});
		
		},
	
		/**
		* Check 
		* @method exisits
		* @param {string} key
		* @param {function} callback
		**/	
		exisits: function(key, callback) {
			rest.get("https://"+storageBucket+".storage.googleapis.com/"+key+"?v="+Date.now()).on("complete", function(data, res) {
				callback(res.statusCode != 404);
			});
		},
	
	
		/**
		* Get meta data for the given key
		* @method metaData
		* @param {string} key
		* @param {function} callback
		**/
		metaData: function(key, callback) {
			var 
				// This url should expire in one hour
				expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
				// Lets put together our policy
				stringPolicy = "HEAD\n" + "\n" + "\n" + expiry + "\n" + '/' + storageBucket + '/' + key,
			
				// create signature and make it url safe
				signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

				// signed url
				url = "https://" + storageBucket + ".storage.googleapis.com/" + key +"?GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
		
			rest.head(url).on("complete", function(err, res) {
				callback(res.headers);
			});	
		
		},
	
		/**
		*
		* @method makePrivate
		**/	
		makePrivate: function(key, callback) {
		
			CloudStorage.metaData(key, function(metaData) {
		
				var 
					// This url should expire in one hour
					expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
					// Lets put together our policy
					stringPolicy = "PUT\n" + "\n" + "\n" + expiry + "\n" + 
						"x-goog-acl:bucket-owner-full-control\n" + 
						// "x-goog-if-generation-match:"+metaData['x-goog-generation']+"\n" + 
						// "x-goog-if-metageneration-match:"+metaData['x-goog-metageneration']+"\n" + 
						'/' + storageBucket + '/' + key + "?acl",
			
					// convert it to Base64
					//base64Policy = Buffer(stringPolicy, "utf-8").toString("base64"),
			
					// create signature and make it url safe
					signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

					// signed url
					url = "https://" + storageBucket + ".storage.googleapis.com/" + key +"?acl&generation="+metaData['x-goog-generation']+"&GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
			
				rest.put(url, {
					headers: {
						// "x-goog-if-generation-match": metaData['x-goog-generation'],
						// "x-goog-if-metageneration-match": metaData['x-goog-metageneration'],
						"x-goog-acl":"bucket-owner-full-control"
					}
				}).on("complete", callback);			
			
			
			});

		},
	
		/**
		*
		* @method makePublic
		**/	
		makePublic: function(key, callback) {
		
			// TODO Maintain Content-Disposition and Content-Type
		
			CloudStorage.metaData(key, function(metaData) {
		
				var 
					// This url should expire in one hour
					expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
					// Lets put together our policy
					stringPolicy = "PUT\n" + "\n" + "\n" + expiry + "\n" + 
								"x-goog-acl:public-read\n" + 
								'/' + storageBucket + '/' + key + "?acl",
			
					// create signature and make it url safe
					signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

					// signed url
					url = "https://" + storageBucket + ".storage.googleapis.com/" + key +"?acl&generation="+metaData['x-goog-generation']+"&GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
			
				rest.put(url, {
					headers: {
						"x-goog-acl":"public-read"
					}
				}).on("complete", callback);
			
			});

		},
	
		/**
		*
		* @method getPublicUrl
		**/
		getPublicUrl: function(key) {
			return "https://" + storageBucket + ".storage.googleapis.com/" + key;
		},
	
		/**
		*
		* @method getPrivateUrl
		**/	
		getPrivateUrl: function(key) {
			// As described here: https://developers.google.com/storage/docs/accesscontrol#Signed-URLs
		
			var 
				// This url should expire in one hour
				expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
				// Lets put together our policy
				stringPolicy = "GET\n" + "\n" + "\n" + expiry + "\n" + '/' + storageBucket + '/' + key,
			
				// create signature and make it url safe
				signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64"));
		
	
			return "https://" + storageBucket + ".storage.googleapis.com/" + key +"?GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
		
		},

		/**
		*
		* @method remove
		**/	
		remove: function(key, callback) {
			var 
				// This url should expire in one hour
				expiry 	= new Date(moment().add('hour', 1).format()).getTime(),
			
				// Lets put together our policy
				stringPolicy = "DELETE\n" + "\n" + "\n" + expiry + "\n" + '/' + storageBucket + '/' + key,
			
				// create signature and make it url safe
				signature = encodeURIComponent(crypto.createSign('sha256').update(stringPolicy).sign(privateKey,"base64")),

				// signed url
				url = "https://" + storageBucket + ".storage.googleapis.com/" + key +"?GoogleAccessId=" + googleServicesEmail + "&Expires=" + expiry + "&Signature=" + signature;
		
			rest.del(url).on("complete", callback);
		},
	
		/**
		* 
		* @method uploadRequest
		* @param isAttachment When isAttachment is set, accessing the file should force a download prompt.
		* @param customFields {Object} dictionary for custom fields
		**/
		uploadRequest: function(filename, key, isAttachment, customFields) {
		
			var mimeType = mime.lookup(filename),
				uploadPolicy = {
					"expiration": moment().add('hour', 1).toISOString(),
					"conditions": [
						{"bucket": storageBucket},
						{"key": key},
						{"Content-Type": mimeType}
					]
				};

			if(isAttachment) {
				uploadPolicy.conditions.push({
					"Content-Disposition": "attachment; filename="+pathLib.basename(filename)
				});
			}
		
			_.each(customFields, function(value, field) {
				var customField = {};
				customField["x-goog-meta-"+field] = value;
			
				uploadPolicy.conditions.push(customField);
			});
		
			var uploadSignature = crypto.createSign('sha256').update(new Buffer(JSON.stringify(uploadPolicy)).toString("base64")).sign(privateKey,"base64");

			var request = {
				GoogleAccessId: googleServicesEmail,
				key: key,
				"Content-Type": mimeType,
				bucket: storageBucket,
				policy: new Buffer(JSON.stringify(uploadPolicy)).toString("base64"),
				signature: uploadSignature,
			};
		
			if(isAttachment) {
				request["Content-Disposition"] = "attachment; filename="+pathLib.basename(filename);
			}
		
			_.each(customFields, function(value, field) {
				request["x-goog-meta-"+field] = value;
			});
		
			return request;

		},
	
		/**
		*
		* @method upload
		**/
		upload: function(filename, key, isAttachment, customFields, callback) {
		
			if(!callback) callback = function() {};
		
			var uploadRequest = CloudStorage.uploadRequest(filename, key, isAttachment, customFields);
		
			// Add the file to the upload request.
			uploadRequest.file = rest.file(filename);

			// multipart request sending a 321567 byte long file using https
			rest.post("https://"+storageBucket+".storage.googleapis.com/", {
				multipart: true,
				data: uploadRequest
			}).on('complete', function(err, res) {
				callback(res.statusCode == 204 || res.statusCode == 200 ? true : false);
			});
		}
	};
	
};