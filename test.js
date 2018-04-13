const sharp = require('sharp');
sharp('/vagrant/images/0004.tif')
  .jpeg({quality: 40})
  .toFile('/vagrant/images/output.jpg', function(err, info) {
	console.log(err);
	console.log(info);
    // output.jpg is a 300 pixels wide and 200 pixels high image
    // containing a scaled and cropped version of input.jpg
  });
