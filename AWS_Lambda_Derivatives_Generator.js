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

	function setMessages(messages, text){
		messages.push(text);
	}

	if(!event || !event.params || !event.params.path){
		messages.push("Invalid event object from API gateway!");
		sendResponse(messages, event);
		return false;
	}

	var parameters = event.params.path;
	// *** Get the parameters from event *** //
	if (parameters.bagName) {
        bagName = parameters.bagName;
    }

    if (parameters.derivativeParams) {
        derivativeParams = parameters.derivativeParams;
    }

    if (parameters.imageName) {
        imageName = parameters.imageName;
        if(!imageName){
			messages.push('imageName papameter is empty!');
		}
		else{
			let imageNameArr = imageName.split('.');
			if(!imageNameArr || imageNameArr.length < 2){
				messages.push('Invalid image name!');
			}
			else{					
				imageType = imageNameArr.pop();
				if(!imageType){
					messages.push('imageType papameter is empty!');
				}
				else{
					imageName = imageNameArr.join('.');
				}
			}
			
		}
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

		messages.push("Start processing images...");

		s3.headObject(params, function (err, metadata) {  
			if (err && err.code === 'NotFound') {  
			    messages.push("Cannot get derivative image from bucket: "+sourceBucket+" with key="+sourceKey+"!");
				messages.push(err.toString());	
				sourceKey = bagName + '/data/' + imageName + '.tif';
				let params = {
					Bucket: sourceBucket,
					Key: sourceKey
				};	
				s3.getObject(params, function(err, imageData) {

					if (err) {
					   messages.push("Cannot get original tif image from bucket: "+params.Bucket+" with key="+params.Key+"!");
					   messages.push(err.toString());
					   sendResponse(messages, event);
				    } else {

					    messages.push('Successfully get the object');
					    messages.push("Retrieve the object from bucket: "+sourceBucket+" with key="+sourceKey+".");
				
					    if(convertFormat === 'jpeg'){
						    sharp(imageData.Body).jpeg({quality: compressionRate}).toBuffer(function (err, resizeData) {

					        	if (err) {
						    		messages.push("Errors in converting the tiff image into JPEG! Object bucket: "+sourceBucket+", key:"+sourceKey+".");
						    		sendResponse(messages, event);
					        	}
					        	else{
					        		var base64data = new Buffer(resizeData, 'binary');
							        var targetKey = bagName + '/data/' + imageName + '.' + imageType;

							        s3.putObject({
							            Bucket: targetBucket,
							            Key: targetKey,
							            Body: base64data,
							            ACL: 'public-read'
							        }, function (err, data) {
							            if (err) {
							                messages.push("Errors in saving the JPEG file as " + targetKey);	
							                sendResponse(messages, event);              
							            } else {
							                messages.push("The converted JPEG file has been saved as "+targetKey);	
							                sendResponse(messages, event);           
							            }
							        });
					        	}

						        
						    });
						}
						else{
							messages.push('The convert format: '+convertFormat+' is not supported yet!');
							sendResponse(messages, event);
						}
				    }

				});
				// messages = processDerivative(sourceBucket, targetBucket, bagName, imageName, imageType, convertFormat, compressionRate, messages, event);	
				// sendResponse(messages, event);   	
			} else {   
			    messages.push("OKOK The derivative has already existed!");
			    sendResponse(messages, event);
			}			
		});


	}

	function processDerivative(sourceBucket, targetBucket, bagName, imageName, imageType, convertFormat, compressionRate, messages, event){

		let sourceKey = bagName + '/data/' + imageName + '.tif';
		let params = {
			Bucket: sourceBucket,
			Key: sourceKey
		};

		const AWS = require('aws-sdk');
		let s3 = new AWS.S3();


		messages.push('Now the params is: Bucket: ' + params.Bucket + '; key: '+params.Key);
		// return messages;
		try{
			messages.push(s3.toString())
			// s3.getObject(params, function(err, imageData) {

			// 	if (err) {
			// 	   messages.push("Cannot get original tif image from bucket: "+params.Bucket+" with key="+params.Key+"!");
			// 	   messages.push(err.toString());
			// 	   return messages;
			//     } else {

			// 	    messages.push('Successfully get the object');
			// 	    messages.push("Retrieve the object from bucket: "+sourceBucket+" with key="+sourceKey+".");
			
			// 	    if(convertFormat === 'jpeg'){
			// 		    sharp(imageData.Body).jpeg({quality: compressionRate}).toBuffer(function (err, resizeData) {

			// 	        	if (err) {
			// 		    		messages.push("Errors in converting the tiff image into JPEG! Object bucket: "+sourceBucket+", key:"+sourceKey+".");
			// 		    		return messages;
			// 	        	}
			// 	        	else{
			// 	        		var base64data = new Buffer(resizeData, 'binary');
			// 			        var targetKey = bagName + '/data/' + imageName + '.' + imageType;

			// 			        s3.putObject({
			// 			            Bucket: targetBucket,
			// 			            Key: targetKey,
			// 			            Body: base64data,
			// 			            ACL: 'public-read'
			// 			        }, function (err, data) {
			// 			            if (err) {
			// 			                messages.push("Errors in saving the JPEG file as " + targetKey);	
			// 			                return messages;                
			// 			            } else {
			// 			                messages.push("The converted JPEG file has been saved as "+targetKey);	
			// 			                return messages;            
			// 			            }
			// 			        });
			// 	        	}

					        
			// 		    });
			// 		}
			// 		else{
			// 			messages.push('The convert format: '+convertFormat+' is not supported yet!');
			// 			return messages;
			// 		}
			//     }

			// });
		}
		catch(err){
			messages.push("Something is wrong during imaging process! Error: "+err.message);
			return messages;
		}
	}


	function sendResponse(messages, event){
		responseBody = {
	        message: messages.toString(),
	        input: event
	    };
	    response = {
	        statusCode: 200,
	        headers: {
	            "x-custom-header" : "test v7"
	        },
	        body: JSON.stringify(responseBody)
	    };

	    console.log("response: " + JSON.stringify(response))
    	callback(null, response);
	}
}




