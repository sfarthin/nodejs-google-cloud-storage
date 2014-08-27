var express = require('express'),
	app  	= express(),
	
	CloudStorage = require("../src/cloudStorage")(process.env.GCS_PRIVATE_KEY || require("path").resolve(__dirname, "../google-services-private-key.pem"));

app.engine('ejs', require('ejs').renderFile);

app.get("/", function(req,res,next) {
	
	var fields = CloudStorage.uploadRequest("example.txt", "key"+Date.now());
	
	res.render(__dirname + "/form.ejs", {fields: fields});
	
});

app.listen(process.env.PORT || 3001);