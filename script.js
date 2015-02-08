"use strict"; 

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
            activities.items.push(JSON.parse(response2.content));            
        })
        
        return activities;
    },

    activity_pre_poll: function(bundle) {
        var request = bundle.request;
        request.headers.Accept = 'application/vnd.com.runkeeper.FitnessActivityFeed+json';

        return request;
    }
};
