const sharp = require('sharp');

var AWS = require('aws-sdk');

var s3 = new AWS.S3();

// Bucket names must be unique across all S3 users

var myBucket = 'ul-bagit';

var myKey = 'source/Kircher_1650/data/0004.tif';

var params = {
  Bucket: myBucket,
  Key: myKey
};

s3.getObject(params, function(err, data) {

if (err) {

   console.log(err);

   } else {

	     console.log('Successfully get the object');
	     console.log(data);
	     sharp(data.Body)
	     .jpeg({quality: 40})
		 .toFile('/vagrant/images/output.jpg', function(err, info) {
		        console.log(err);
		        console.log(info);
		    // output.jpg is a 300 pixels wide and 200 pixels high image
		    // containing a scaled and cropped version of input.jpg
		  });
   }

});
