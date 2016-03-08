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
			text = text + "</body></html>";
			//response.writeHead(200, {"Content-Type": "text/html"});
			//response.write(text);
			//response.end();	

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
	return "<!DOCTYPE html><html><head><script type='text/javascript' href='http://localhost:1337/node_modules/c3/c3.js'></script><link rel='stylesheet' type='text/css' href='http://localhost:1337/node_modules/c3/c3.css'></head><body><table style='width: 100%; height: 500px;' ><tr><td style='text-align: center; vertical-align:middle'><h1>Custom Report</h1></td></tr></table><div style='page-break-before: always;'></div>";
}

function getCharts(callback)
{
	var ChartsAreLoaded = [];
	var charts = [{id: 1, color: ["red", "orange", "purple"], width: 500, height: 500}, {id: 2, color: ["green", "yellow", "black"], width: 400, height: 400},{id: 3, color: ["blue", "red", "teal"], width: 300, height: 300}];

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
    html: "<html><body><div id='chart'></div></body></html>",
    scripts: [
      'http://d3js.org/d3.v3.min.js',
      'http://localhost:1337/node_modules/c3/c3.js',
      'http://localhost:1337/node_modules/c3/c3.css'
    ],
    done: function(errors, window) {

    	var c3 = window.c3;		  
    	var d3 = window.d3;

    	var periodOne = ['2013-01-01', '2013-01-04', '2013-01-07','2013-01-11','2013-01-15'];
		var periodTwo = ['2013-01-02', '2013-01-04', '2013-01-06','2013-01-08', '2013-01-10','2013-01-13', '2013-01-15','2013-01-18', '2013-01-22'];
		var periodThr = ['2013-01-05', '2013-01-10', '2013-01-15','2013-01-20', '2013-01-25'];
		var xOne = [12,31,14,13,34];
		var xTwo = [11,13,14,23,63,27,21,19,15];
		var xThr = [12,32,13,13,23];

	    var chart = c3.generate({padding: {
			  left: 40,
			  bottom: 60,
			},
	        size: {
	        width: widthval,
	        height: heightval
	    },
        data: {
        	xs:{
                //Declare the axes
                'LT01_D': 'x1',
                'LT02': 'x2',
                'LT_01S': 'x3'
            },
            columns: [
                ['x1'].concat(periodOne),
                ['x2'].concat(periodTwo),
                ['x3'].concat(periodThr),
                ['LT01_D'].concat(xOne),
                ['LT02'].concat(xTwo),
                ['LT_01S'].concat(xThr)
            ],
            type: 'line',
	        colors: {
	            'LT01_D': color[0],
	            'LT02': color[1],
	            'LT_01S': color[2]
	        },
        },
        legend: {
        	show: false
		},
        axis: {
            x: {
                type: 'timeseries',
	            tick: {
	                format: '%Y-%m-%d',
      				rotate: 90,
      				fit: false,
	            },
            	show: true
            },
        }
      });

      var svg = d3.select("svg");


	svg.append("foreignObject").attr("width", widthval).attr("height", 20).attr("y", heightval - 20).append("xhtml:div").attr('class', 'legend').selectAll('span')
    .data(['LT01_D', 'LT02', 'LT_01S']).enter().append('span')
    .attr('data-id', function (id) { return id; })
    .html(function (id) {  
    	var html = '<span style="padding-left: 10px; font-size: 8pt"><svg width="10" height="10"><rect width="10" height="10" fill="'+chart.color(id)+'"></rect></svg><span style="padding-left: 5px">' + id + '</span></span>'; 	
    	return html; 
    })
    .each(function (id) {
    	//d3.select(this).append("svg").attr("width", 20).attr("height", 20).append("rect").attr("width", 20).attr("height", 20).attr("fill", chart.color(id));
    });

      svg.selectAll("defs").remove();
      setTimeout(function () { callback(id, "<div class='c3' style='width: 100%; position: relative'>"+ window.document.getElementById("chart").innerHTML + "</div>"); }, 500);
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
