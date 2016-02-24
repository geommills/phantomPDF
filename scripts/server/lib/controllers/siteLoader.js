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
	fs.readFile("./index.html", "utf-8", function(err, text) {

		//text = "<h1>Hello from Page 1</h1>"
		//			  + "<div style='page-break-before: always;'></div>"
		//			  + "<h1>Hello from Page 2</h1>"
		//			  + "<div style='page-break-before: always;'></div>"
		//			  + "<h1>Hello from Page 3</h1>";
		runPrint(response, text)
		.then(function(result) {	
	    	 response.end();	
		});
	});
}

function runPrint(response, text)
{
	return jsreport.render({
		template: {
			content: text,			
			engine: 'jsrender', 
			recipe: 'phantom-pdf',
	        phantom: {
	            header: "<div style='width: 100%; border-bottom: solid 1px black'>Report of Charts!</div>",
	            footer: "<div style='text-align:right'>page {#pageNum} of {#numPages}</div>",
	            orientation: "landscape",
	            format: "A5",
	            margin: "40px"
	        }
		}
	})
	.then(function(out) {
		console.log("Successful Creation");
		response.setHeader("Content-disposition", "attachment; filename=newpdf.pdf");
		response.writeHead(200, {"Content-Type": "application/pdf"});
		response.write(out.result._object, "binary");
		response.end();
		return "success";
	})
	.catch(function(e) {    
		response.end(e.message);
		return "failed";
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
