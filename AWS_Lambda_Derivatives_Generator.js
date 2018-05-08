exports.handler = function(event, context, callback){

	const sourceBucket = 'ul-ir-workspace';
	const targetBucket = 'ul-ir-workspace';

	var messages = [];

	var bagName = null;

	var derivativeParams = null;

	var imageName = null;

	var imageType = null;

	var sourceKey = null;

	var response = null;

	var responseBody = null;

	var responseCode = 200;

	var convertFormat = null;

	var compressionRate = 0;

	var parameters = event.queryStringParameters;
	if(!parameters){
		messages.push('event queryStringParameters is empty!');
	}
	else{
		// *** Get the parameters from event *** //
		if (parameters.bagName) {
	        bagName = parameters.bagName;
	    }

	    if (parameters.derivativeParams) {
	        derivativeParams = parameters.derivativeParams;
	    }

	    if (parameters.imageName) {
	        imageName = parameters.imageName;
	    }

	    if (parameters.imageType) {
	        imageType = parameters.imageType;
	    }
	    
	    if(!bagName){
			messages.push('bagName papameter is empty!');
		}

		if(!derivativeParams){
			messages.push('derivativeParams papameter is empty!');
		}
		else{
			let derivativeParamsArr = derivativeParams.split('_');
			if(derivativeParamsArr.length !== 3){
				messages.push('derivativeParams papameter is NOT set correctly!');
			}
			else{
				convertFormat = derivativeParamsArr[0];
				try{
					compressionRate = parseInt(derivativeParamsArr[1]);
				}
				catch(error){
					messages.push('compressionRate is NOT a number! Error: '+error.message);
				}
			}
		}

		if(!imageName){
			messages.push('imageName papameter is empty!');
		}

		if(!imageType){
			messages.push('imageType papameter is empty!');
		}
	}


	if(messages.length > 0){
		responseBody = {
	        message: messages.toString(),
	        input: event
	    };

		response = {
	        statusCode: responseCode,
	        headers: {
	            "x-custom-header" : "Errors header"
	        },
	        body: JSON.stringify(responseBody)
	    };

	    console.log("response: " + JSON.stringify(response))
	    callback(null, response);
	}
	else{

		const sharp = require('sharp');
		const fs = require('fs');
		const debug = require('debug');
		const AWS = require('aws-sdk');

		var s3 = new AWS.S3();

		sourceKey = bagName + '/data/' + imageName + '.' + imageType;

		var params = {
		  Bucket: sourceBucket,
		  Key: sourceKey
		};

		let derivativeExists = false;

		messages.push("Start processing images...");
		
		s3.headObject(params, function (err, metadata) {  
			if (err && err.code === 'NotFound') {  
			    messages.push("Cannot get derivative image from bucket: "+sourceBucket+" with key="+sourceKey+"!");
				messages.push(err.toString());
			   	console.log(err);
			} else {  
			    // s3.getSignedUrl('getObject', params, callback);  
			    derivativeExists = true;
			    messages.push("OKOK The derivative has already existed!");
			}
		});

		if(derivativeExists === true){
			messages.push("The derivative has already existed!");
		}
		else{
			sourceKey = bagName + '/data/' + imageName + '.tif';
			params.Key = sourceKey;

			messages.push('Now the params is: Bucket: ' + params.Bucket + '; key: '+params.Key);

			try{
				s3.getObject(params, function(err, imageData) {

					if (err) {
					   messages.push("Cannot get original tif image from bucket: "+params.Bucket+" with key="+params.Key+"!");
					   messages.push(err.toString());
					   // console.log(err);
					   sourceKey = bagName + '/data/' + imageName + '.tiff';
					   params.sourceKey = sourceKey;

				    } else {

					    // console.log('Successfully get the object');
					    messages.push('Successfully get the object');
					    messages.push("Retrieve the object from bucket: "+sourceBucket+" with key="+sourceKey+".");
				
					    if(convertFormat === 'jpeg'){
						    sharp(imageData.Body).jpeg({quality: compressionRate}).toBuffer(function (err, resizeData) {

					        	if (err) {
					        		// console.log('Errors in converting the tiff image into JPEG!');
						    		messages.push("Errors in converting the tiff image into JPEG! Object bucket: "+sourceBucket+", key:"+sourceKey+".");
					        	}


						        var base64data = new Buffer(resizeData, 'binary');
						        var targetKey = bagName + '/data/' + imageName + '.' + imageType;

						        s3.putObject({
						            Bucket: targetBucket,
						            Key: targetKey,
						            Body: base64data,
						            ACL: 'public-read'
						        }, function (err, data) {
						            if (err) {
						                // console.log('Failed to save new image due to an error: ' + err);
						                messages.push("Errors in saving the JPEG file as " + targetKey);		                
						            } else {
						                // console.log('s3 image uploaded');
						                messages.push("The converted JPEG file has been saved as "+targetKey);		                
						            }
						        });
						    });
						}
						else{
							messages.push('The convert format: '+convertFormat+' is not supported yet!');
						}
				    }

				});
			}
			catch(err){
				messages.push("Something is wrong during imaging process! Error: "+err.message);
			}
		}

		responseBody = {
	        message: messages.toString(),
	        input: event
	    };

		response = {
	        statusCode: responseCode,
	        headers: {
	            "x-custom-header" : "test v6"
	        },
	        body: JSON.stringify(responseBody)
	    };

	    console.log("response: " + JSON.stringify(response))
	    callback(null, response);
	}
}




