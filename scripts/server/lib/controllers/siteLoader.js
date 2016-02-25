var url = require('url');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var jsreport = require('jsreport');
var when = require('when');
var jsdom = require('jsdom');
var d3 = require('d3');




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
	createChart(500, 500, function(chart){
		console.log("Called back!", chart);
		var text = chart
					  + "<div style='page-break-before: always;'></div>"
					  + chart
					  + "<div style='page-break-before: always;'></div>"
					  + chart
		runPrint(response, text)
		.then(function(result) {
			response.setHeader("Content-disposition", "attachment; filename=newpdf.pdf");
			response.writeHead(200, {"Content-Type": "application/pdf"});
			response.write(result._object, "binary");
			response.end();	
		});
	});
	/*fs.readFile("./index.html", "utf-8", function(err, text) {
		
	});*/
}

function createChart(width, height, callback){
  jsdom.env({
    html: "<html><body></svg></body></html>",
    scripts: [
      'http://d3js.org/d3.v3.min.js'
    ],
    done: function(errors, window) {

		  var d3 = window.d3;
		  var pad     = { t: 10, r: 10, b: 50, l: 40 },
		      width   = 800 - pad.l - pad.r,
		      height  = 500 - pad.t - pad.b,
		      samples = d3.range(10).map(d3.random.normal(10, 5)),
		      x       = d3.scale.linear().domain([0, samples.length - 1]).range([0, width]),
		      y       = d3.scale.linear().domain([0, d3.max(samples)]).range([height, 0]),
		      xAxis   = d3.svg.axis().scale(x).orient('bottom').tickSize(height),
		      yAxis   = d3.svg.axis().scale(y).orient('left')

		  var line = d3.svg.line()
		    .interpolate('basis')
		    .x(function(d, i) { return x(i) })
		    .y(y)

		  var vis = d3.select('body').html('').append('svg')
		    .attr('xmlns', 'http://www.w3.org/2000/svg')
		    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
		    .attr('width', width + pad.l + pad.r)
		    .attr('height', height + pad.t + pad.b)
		  .append('g')
		    .attr('transform', 'translate(' + pad.l + ',' + pad.t + ')')

		  vis.append('g')
		    .attr('class', 'x axis')
		    .call(xAxis)

		  vis.append('g')
		    .attr('class', 'y axis')
		    .call(yAxis)

		  vis.selectAll('.axis text')
		    .style('fill', '#888')
		    .style('font-family', 'Helvetica Neue')
		    .style('font-size', 11)

		  vis.selectAll('.axis line')
		    .style('stroke', '#eee')
		    .style('stroke-width', 1)

		  vis.selectAll('.domain')
		    .style('display', 'none')

		  vis.selectAll('path.samples')
		    .data([samples])
		  .enter().append('path')
		    .attr('class', 'samples')
		    .attr('d', line)
		    .style('fill', 'none')
		    .style('stroke', '#c00')
		    .style('stroke-width', 2);

		  /*vis.append('svg:g')
		    .attr('class', 'x axis')
		    .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
		    .call(xAxis);

		  vis.append('svg:g')
		    .attr('class', 'y axis')
		    .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
		    .call(yAxis);*/

       callback(window.d3.select("body").html()); // instead of a return, pass the results to the callback
    }
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
	            header: "<div style='width: 100%; border-bottom: solid 1px black; font-size: 14pt'>Report of Charts!</div>",
	            footer: "<div style='text-align:right'>page {#pageNum} of {#numPages}</div>",
	            orientation: "landscape",
	            format: "A5",
	            margin: "40px"
	        }
		}
	})
	.then(function(out) {
		return out.result;
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

		responseType !== "" ? response.writeHead(200, {"Content-Type": responseType}) : false;
		response.write(file, "binary");
		response.end();
	});
  }); 

} 
