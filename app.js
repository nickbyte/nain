var https = require("https");
var http = require("http");
var fs = require('fs');
var bodyParser = require('body-parser');
var path = require("path");
var express = require('express');
var openurl = require("openurl")
var app = express();
var forEach = require('async-foreach').forEach;
var mustacheExpress = require('mustache-express');
app.use(bodyParser());
app.use('/app', express.static('app'));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/app');
app.get('/', function(req, res) {
    res.render('form', {
        head: {
            title: 'Nain App'
        },
        content: {
            title: 'Nain App',
            desc: 'Enter the list of places to get its latitude longitude'
        }
    });
});
app.post('/', function(req, res) {
    str = req.body.citylist;
    html = str.split('\r\n');
    var cities = html;
    header = "city" + "\t" + "latitude" + "\t" + "Longitude" + "\n"
    latlngfilename = "nain-" + Date.now() + ".xls";
    fs.appendFile('app/temp/' + latlngfilename + '', header, function(err) {});

    function delayCall(city, index) {
        url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + city + "&key=AIzaSyAbnrbT9uCJwqKEsWzYwop8rQ63ymkMbAI";
        var request = https.get(url, function(response) {
            var buffer = "",
                data,
                geolocation;
            response.on("data", function(chunk) {
                buffer += chunk;
            });
            response.on("end", function(err) {
                data = JSON.parse(buffer);
                geolocation = data.results[0];
                console.log("Longitude, latitude", geolocation["geometry"].location);
                dynamicRow = city + "\t" + geolocation["geometry"].location.lat + "\t" + geolocation["geometry"].location.lng + "\n";
                fs.appendFile('app/temp/' + latlngfilename + '', dynamicRow, function(err) {});
            });

        });
    }
    var timeoutLength = 3000;
    forEach(cities, function(city, index) {
        setTimeout(function() {
            delayCall(city, index)
            if (index == cities.length - 1) {
                res.writeHead(301, {
                    Location: '/thankyou'
                });
                res.end();

            }
        }, timeoutLength * index);
    });
})
app.get('/thankyou', function(req, res) {
    res.render('result', {
        head: {
            title: 'Nain App'
        },
        content: {
            title: 'We are done! thanks',
            desc: 'Thanks for your patience, click below to download'
        },
        download: '/app/temp/' + latlngfilename,
        cityLength: html.length
    });
})
var server = http.createServer(app);
server.listen(8080);
