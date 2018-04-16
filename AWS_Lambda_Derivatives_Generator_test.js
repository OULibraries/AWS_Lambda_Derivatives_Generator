const sharp = require('sharp');
const fs = require('fs');

var AWS = require('aws-sdk');

var s3 = new AWS.S3();

// Bucket names must be unique across all S3 users

var myBucket = 'ul-bagit';

var targetBucket = 'ul-ir-workspace';

var myKey = 'source/Kircher_1650/data/0004.tif';

var targetKeyPrefix = 'lambda';

var params = {
  Bucket: myBucket,
  Key: myKey
};


let file_path = '/vagrant/images/output.jpg';



s3.getObject(params, function(err, imageData) {

	if (err) {

	   console.log(err);
	   return 0;

    } else {

	    console.log('Successfully get the object');
	    console.log(imageData);
	    
	    sharp(imageData.Body).jpeg({quality: 40}).toBuffer(function (err, resizeData) {

        	if (err) throw err;

	        console.log(resizeData);

	        var base64data = new Buffer(resizeData, 'binary');

	        s3.putObject({
	            Bucket: targetBucket,
	            Key: targetKeyPrefix + '/test3.jpg',
	            Body: base64data,
	            ACL: 'public-read'
	        }, function (err, data) {
	            if (err) {
	                console.log('Failed to save new image due to an error: ' + err);
	                return 0;
	            } else {
	                console.log('s3 image uploaded');
	                return 1;
	            }
	        });
	    });
   }

});
