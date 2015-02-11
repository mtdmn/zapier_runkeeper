"use strict"; 

/*
    Our scripting engine uses JavaScript. As you'd expect, it provides the standard 
    JavaScript interfaces (JSON, Math, Date and more) as well as $ for jQuery (1.8.3),
    _ for Underscore (1.4.4), and moment for Moment.js (2.0.0). Plus, it has some 
    handy Zapier specific tools on the z object!
*/

function GpxParser () {
    // constructor
     //2015-01-11T01:40:33.000Z
     this.startTime = "";
     this.path = "";
}

GpxParser.prototype = {
    setJson: function (json) {
        this.startTime = new Date(json.start_time);
        var start_offset = this.startTime.getTime() - json.utc_offset * 60 * 60 * 1000;
        this.startTime.setTime(start_offset);
        this.path = json.path;
    },
    
    dump: function () {
    
        function getAbsTimeStr(secFromStart, startTime) {
            var date = new Date(startTime);
            var offset = startTime + secFromStart * 1000;
            return date.setTime(offset).toISOString();
        }
        var header = '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="runkeeper zapier app" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><link href="www.zapier.com"><text>zapier</text></link><time>'+this.startTime.toISOString()+'</time></metadata>';
        var trk = "<trk>";
        trk += "<name>runkeeper activity via zapier</name>";
        trk += "<trkseg>";
        var date = new Date();
        _.each(this.path, function(point) {        
            var offset = this.startTime.getTime() + point.timestamp * 1000;
            date.setTime(offset);
            trk += "<trkpt";
            trk += " lon='" + point.longitude + "'";
            trk += " lat='" + point.latitude + "'" + ">";
            trk += " <ele>" + point.altitude + "</ele>";
            trk += " <time>" + date.toISOString() + "</time>";
        /*
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>128</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
        */
            trk += "</trkpt>";
        }, this);
        trk += "</trkseg>";
        trk += "</trk>";
        var footer = '</gpx>';
        return header+trk+footer;
    }
};



var Zap = {
    activity_post_poll: function(bundle) {
      /* 
      Argument:
      bundle.response.status_code: <integer>
      bundle.response.headers: <object>
      bundle.response.content: <str>

      bundle.request: <original object from TRIGGERKEY_pre_poll bundle>

      bundle.auth_fields: <object>
      bundle.trigger_fields: <object> # the fields provided by the user during setup

      bundle.zap: <object> # info about the zap
      bundle.meta: <object> # extra runtime information you can use

      The response should be JSON serializable:
      [
        <object>, # with unique 'id' key
        <object> # with unique 'id' key
      ]
      */
        var response = bundle.response;
        var results = JSON.parse(bundle.response.content);
        var activities = { id : "activities", items : [] };
        _.each(results.items, function(result) {
            console.log('uri: ' + result.uri);
            var request2 = {
              'method': 'GET',
              'url': 'http://api.runkeeper.com'+result.uri,
              'headers': {
                'Accept': 'application/vnd.com.runkeeper.FitnessActivity+json',
                'Authorization': 'Bearer '+ bundle.auth_fields.access_token
              }
            };

            // perform synchronously
            var response2 = z.request(request2);
            console.log('Status: ' + response2.status_code);
  //          activities.items.push(JSON.parse(response2.content));    
            
            // json to GPX conversion
            var gpxp = new GpxParser();
            gpxp.setJson(JSON.parse(response2.content));
            var gpx = gpxp.dump();
            activities.items.push({"gpx": gpx});
        });
        

        return activities;
    },

    activity_pre_poll: function(bundle) {
        var request = bundle.request;
        request.headers.Accept = 'application/vnd.com.runkeeper.FitnessActivityFeed+json';

        return request;
    },
    
    _dump_gpx: function(activity) {
    }
};
