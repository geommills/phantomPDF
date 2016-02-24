var url = require('url');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var jsreport = require('jsreport')
var when = require('when');


var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: '',
        pass: ''
    }
});

exports.sendEmail = function (request, response, next)
{
	var mailOptions = {
	    from: '', // sender address
	    to: '', // list of receivers
	    subject: '', // Subject line
	    text: decodeURI(request.params.body) , // plaintext body
	    html: decodeURI(request.params.body)  // html body
	};
	console.log(mailOptions);
	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	    	console.log(error);
      		response.writeHead(200, {"Content-Type": "text/plain"});
	      	response.write(error);
	      	response.end();
	    }else{
      	  response.writeHead(200, {"Content-Type": "text/plain"});
	      response.write("" );
	      response.end();
	    }
	});
}

exports.printPage = function (request, response, next)
{
	console.log("Print Page Called!");



	fs.readFile("./index.html", "utf-8", function(err, text) {
		console.log(text)
		runPrint(response, text)
		.then(function(result) {	
			console.log(result);
	    	 response.end();	
		});
	});



      	  //response.writeHead(200, {"Content-Type": "text/plain"});
	      //response.write("Print this" );
	      //response.end();	
}

function runPrint(response, text)
{
	return jsreport.render(text)
	.then(function(out) {
		console.log('Its all good yo');
    	//pipe pdf with "Hi there!"
    	console.log(out.result._object);
		//out.result.pipe(response);
		response.write(out.result._object, "binary");
		response.end();
        response.setHeader("Content-disposition", "attachment; filename=newpdf.pdf");
      	 response.writeHead(200, {"Content-Type": "application/pdf"});
    	return "success";
	});
}

exports.loadsite = function (request, response, next)
{
	console.log('Called Load Site');

  	var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

    console.log(request);
    console.log(response);

  if(request.url.toLowerCase().indexOf("/controllers/") > -1)
	filename = "";
  if(request.url.toLowerCase().indexOf("/appServer/") > -1)
	filename = "";
  if(request.url.toLowerCase().indexOf("/utilities/") > -1)
	filename = "";

  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n" + filename );
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

	console.log(filename);
	fs.readFile(filename, "binary", function(err, file) {
		if(err) {        
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.write(err + "\n");
			response.end();
			return;
		}
		var responseType = "";	  
		//fix specifically for contenttype in css, if not included IE9 it doesn't render for security purposes 
		switch(path.extname(filename))
		{
		case ".html":
			responseType = "text/html";
			break;
		case ".js":
			responseType = "text/javascript";
			break;
		case ".css":
			responseType = "text/css";
			break;	
		default:
			//nada
			break;
		}
		console.log(responseType);
		responseType !== "" ? response.writeHead(200, {"Content-Type": responseType}) : false;
		response.write(file, "binary");
		response.end();
	});
  }); 

} 
