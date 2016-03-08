var url = require('url');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var jsreport = require('jsreport');
var when = require('when');
var jsdom = require('jsdom');
var d3 = require('d3');
var _ = require('lodash');




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
	var text = getCoverPage();
	getTabularData(response, function(tabularData){
		text = text + tabularData;
		getCharts(function(ChartObjects){
			for(var j=0; j <ChartObjects.length; j++)
			{
				var chartobj2 = ChartObjects[j];	
					if(text !== "")
					{
						text = text + "<div style='page-break-before: always;'></div>";
					}	
					text = text + "<table><tr><td>" + chartobj2 + "</td></tr></table>";
			}

				response.writeHead(200, {"Content-Type": "text/html"});
			response.write(text);
				response.end();	

			runPrint(response, text)
			.then(function(result) {
				response.setHeader("Content-disposition", "attachment; filename=newpdf.pdf");
				response.writeHead(200, {"Content-Type": "application/pdf"});
				response.write(result._object, "binary");
				response.end();	
			});
		});
	});
}

function getTabularData(response, callback)
{
	var data = [];
	var html = "<table style='width: 100%' cellspacing='0' cellpadding='20'><tr><td><table style='width: 100%' cellspacing='0' cellpadding='5'>";	
	fs.readFile("./scripts/server/data/lt01d.csv", 'utf8', function (err,dataset) {
		if (err) {
	    	console.log(err);
	    	response.send(err);
	  	}
	  	var remaining = '';
	  	data = dataset;
	  	remaining += data;
		var index = remaining.indexOf('\n');
		var count = 0;
		var header = "";
	      var instrument = "";
		while (index > -1) {
	      index = remaining.indexOf('\n');
	      var line = remaining.substring(0, index);
	      var splitData = line.split(',');
	      remaining = remaining.substring(index + 1);
	      var style="style='border-bottom: solid 1px black'";
	      if(count==0)
	      {
	      	  index = remaining.indexOf('\n');
	      	  var line2 = remaining.substring(0, index);
	      	  var splitData2 = line2.split(',');	
	      	  console.log("Values:", splitData2)
	      	  html = html + "<tr>";
		      html = html + "<td "+style+">"+splitData2[0]+"</td>";
		      instrument = splitData2[0];
	      	  header = header + "<tr>";
		      header = header + "<td "+style+">instrument_name</td>";
			  for(var i=1; i < splitData.length; i++)
			  {	      	
			      html = html + "<td "+style+">"+splitData[i]+"</td>";
			      header = header + "<td "+style+">"+splitData[i]+"</td>";
			  }

	      }
	      else
	      {
	      	  console.log(instrument, splitData[0]);
		  	  if(instrument !== splitData[0] && splitData[0] !== "")
		  	  {
		  	  	instrument = splitData[0];
		  	  	html = html + header.replace("instrument_name", instrument)
		  	  }
	      	  style = "";
	      	  html = html + "<tr>";
		      html = html + "<td>&nbsp;</td>";
			  for(var i=1; i < splitData.length; i++)
			  {	      	
			      html = html + "<td "+style+">"+splitData[i]+"</td>";
			  }
	  	  }
	      html = html + "</tr>";
	      count +=1;
		}
		html = html + "</table></tr></td></table>";
		return callback(html);
	});
}

function getCoverPage()
{
	return "<table style='width: 100%; height: 500px;' ><tr><td style='text-align: center; vertical-align:middle'><h1>Custom Report</h1></td></tr></table><div style='page-break-before: always;'></div>";
}

function getCharts(callback)
{
	var ChartsAreLoaded = [];
	var charts = [{id: 1, color: "red", width: 500, height: 500}];//, {id: 2, color: "green", width: 400, height: 400},{id: 3, color: "blue", width: 300, height: 300}];

	for(var i=0; i <charts.length; i++)
	{
		chartobj = charts[i];	
		createChart(chartobj.width, chartobj.height, i, chartobj.color, function(id, chartval){
			ChartsAreLoaded.push(chartval);		
			if(ChartsAreLoaded.length == charts.length)
			{
				callback(ChartsAreLoaded);
			}		
		});
	}
}

function createChart(widthval, heightval, id, color, callback){

  jsdom.env({
    html: "<html><body><div id='chart' style='padding:30px'></div></body></html>",
    scripts: [
      'http://localhost:1337/node_modules/c3/c3.js',
      'http://localhost:1337/node_modules/c3/c3.css',
      'http://d3js.org/d3.v3.min.js'
    ],
    done: function(errors, window) {

    	  var c3 = window.c3;
		  var chart = c3.generate({
		  	size: {
			  width: widthval,
			  height: heightval
			},
		    data: {
		        x: 'x',
		        columns: [
		            ['x', '2013-01-01', '2013-01-02', '2013-01-03', '2013-01-04', '2013-01-05', '2013-01-06', '2013-01-07', '2013-01-08', '2013-01-09', '2013-01-10', '2013-01-11', '2013-01-12'],
		            ['sample', 30, 200, 100, 400, 150, 250, 30, 200, 100, 400, 150, 250]
		        ]
		    },
		    axis: {
		        x: {
		            type: 'timeseries',
		        }
		    }
		  });

/*
		  var d3 = window.d3;
		  var pad     = { t: 10, r: 10, b: 50, l: 40 },
		      width   = widthval - pad.l - pad.r,
		      height  = heightval - pad.t - pad.b,
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
		    .style('stroke', color)
		    .style('stroke-width', 2);
*/
	    //console.log(window.document.getElementById("chart").innerHTML);
	    callback(id,window.document.getElementById("chart").innerHTML);
       //callback(id, window.d3.select("body").html()); // instead of a return, pass the results to the callback
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

  fs.exists(filename, function(exists) {
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
