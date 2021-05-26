/*
    In Browser, get a list of custom attributes by application name.
    The generated report is useful to detect all custom attributes added 
    to the default events and which applications(teams) are using them.
    This report will help identifying a list of best practises for naming 
    custom attributes.

    Author: Amine Benzaied (Solution Architect)
    Team: Expert services - DTS
*/

const request = require('request');
const fs = require('fs');
// Arguments and how to use this script
const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -k K2AUkrAPR7oXqPVYmvkS0NUzseUabscdE -a 12345', 'Get list of custom attributes by application for each browser event type')
    .alias('k', 'key')
    .nargs('k', 1)  // The number of arguments that should be consumed after a key
    .describe('k', 'Insight query key')
    .demandOption(['k'], 'Please provide the insight query key')
    .alias('a', 'account')
    .nargs('a', 1)  // The number of arguments that should be consumed after a key
    .describe('a', 'RPM account Id')
    .demandOption(['a'], 'Please provide the account Id')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2019')
    .argv;

const insightKey = argv.k;
const accountId = argv.a;

// Defaults attributes per event type
const pageView = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','backendDuration','browserTransactionName',
    'city','connectionSetupDuration','countryCode','deviceType','dnsLookupDuration','domain','domProcessingDuration','duration','name',
    'networkDuration','pageRenderingDuration','pageUrl','queueDuration','regionCode','secureHandshakeDuration','session','userAgentName',
    'userAgentOS','userAgentVersion','webAppDuration','timestamp'];

const pageAction = ['actionName','appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','browserHeight','browserWidth','city','timestamp',
    'countryCode','currentUrl','name','pageUrl','referrerUrl','regionCode','session','timeSinceLoad','userAgentName','userAgentOS','userAgentVersion'];

const browserInteraction = ['actionText','ajaxCount','appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','backendTransactionName',
    'browserInteractionId','browserInteractionName','category','city','countryCode','deviceType','domain','duration','eventId','jsDuration',
    'monitorAccountId','monitorId','monitorJobId','parentEventId','previousGroupedUrl','previousRouteName','previousUrl','regionCode','session',
    'targetGroupedUrl','targetRouteName','targetUrl','timestamp','timeToConnectEnd','timeToConnectStart','timeToDomainLookupEnd','timeToDomainLookupStart',
    'timeToDomComplete','timeToDomContentLoadedEventEnd','timeToDomContentLoadedEventStart','timeToDomInteractive','timeToDomLoading','timeToFetchStart',
    'timeToLoadEventEnd','timeToLoadEventStart','timeToRedirectEnd','timeToRedirectStart','timeToRequestStart','timeToResponseEnd','timeToResponseStart',
    'timeToSecureConnectionStart','timeToUnloadEventEnd','timeToUnloadEventStart','trigger','userAgentName','userAgentOS','userAgentVersion'];

const ajaxRequest = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','browserInteractionId','browserInteractionName','city','countryCode',
    'deviceType','eventId','groupedPageUrl','groupedRequestUrl','requestUrl','hostname','httpMethod','httpResponseCode','jsDuration','pageUrl','pageURL',
    'parentEventId','port','regionCode','requestBodySize','responseBodySize','session','timeSinceBrowserInteractionStart','timestamp','timeToLastCallbackEnd',
    'timeToLoadEventStart','timeToSettle','userAgentName','userAgentOS','userAgentVersion'];

const javaScriptError = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','city','countryCode','domain','pageUrl','sessionId','userAgent',
    'browserInteractionId','browserStackHash','deviceType','errorClass','errorMessage','firstErrorInSession','parentEventId','releaseIds','requestUri','stackHash',
    'stackTrace','stackTraceGzip','timestamp','transactionName','userAgentName','userAgentOS','userAgentVersion','monitorAccountId','monitorId','monitorJobId'];


getCustomAttrByApp('PageView', pageView);
getCustomAttrByApp('PageAction', pageAction);
getCustomAttrByApp('BrowserInteraction', browserInteraction);
getCustomAttrByApp('AjaxRequest', ajaxRequest);
getCustomAttrByApp('JavaScriptError', javaScriptError);

function getCustomAttrByApp(eventType, defaultAttributes) {

    var keySet = `Select keyset() from ${eventType} since 1 week ago`;

    getQueryInsight(keySet,insightKey)
        .then(function(attributes){
            var allKeys = attributes.results[0].allKeys;
            var customAttr = allKeys.filter(element => defaultAttributes.indexOf(element)<0);
            return customAttr;
        }).then(function(customAttr){
            if (customAttr.length != 0) {
                // I need to split the custom attributes into groups of 20 otherwise the request will fail
                var listOfQueries = customAttr.map((item,index) => (index%20 === 0) ? customAttr.slice(index, index+20) : null) 
                                            .filter(item => item)
                                            .map(list => constructQuery(list,eventType));
                
                var promises = listOfQueries.map(element => getQueryInsight(element, insightKey));
                Promise.all(promises)
                    .then(results => {
                            var table = results.map(result => result.facets)
                                            .map(apps => {
                                                        var obj = {};
                                                        apps.forEach(app => { 
                                                            if (app.name) { 
                                                                obj[app.name] = app.results.map(ele => ele.count); 
                                                            }
                                                        });
                                                        return obj;
                                                })
                            // Let's consolidate the response of all requests into 1 result
                            // multiply index by 20 because previously we split the custom attr into groups of max 20
                            var result = {};
                            var defaultArray = new Array(customAttr.length).fill(0);
                            table.forEach((current, index) => {
                                Object.keys(current).map(elem => {
                                    if(!Object.keys(result).includes(elem)) {
                                        result[elem] = defaultArray.slice();
                                    }
                                        result[elem].splice(index*20,current[elem].length,...current[elem]);
                                });
                            });
                            // Remove all empty rows. i.e: app1: [0,0,0,0,0]... for some reason the insight response includes empty results
                            Object.keys(result).forEach(item => {
                                if(JSON.stringify(result[item])===JSON.stringify(defaultArray)) {
                                    delete result[item];
                                }
                            });
                                            
                            // customAttr = Array [attr1, attr2, ...]  result = Object {app1:[count values], app2: [count values], ...}
                            generateReport(customAttr, result, eventType);
                    }).catch(reason => console.log(reason));
            } else {
                console.log(`No custom attributes found for ${eventType} event`);
            }
        }).catch(reason => console.log(reason));
}

function constructQuery(customAtt, eventType) {

    var query = customAtt.map(attribute => "filter(count(*), where `" + attribute + "` is not null) as '" + attribute + "'")
                         .join();
    query = 'Select ' + query + ' From ' + eventType + ' facet appName since 1 week ago limit 1000';

    return query;

}

function getQueryInsight(query, key) {

    var url = 'https://insights-api.newrelic.com/v1/accounts/'.concat(accountId,'/query?nrql=',encodeURIComponent(query).replace(/'/g, "%27"));
	return new Promise(function(resolve, reject){		
		request.get({
			headers: {
				'X-Query-Key': key,
                'Accept': 'application/json'
			},
			uri: url,
			method: 'GET'
		},function(err,resp,body){
			if(!err && resp.statusCode == 200) {
				resolve(JSON.parse(body));
			}
			else{
				reject('Ooops something went wrong while contacting this url ' + url + '\n' +resp.body);
			}
		});	
	});
}

function generateReport(columns, rows, eventType) {

    columns.unshift('Application/Custom Attribute');
    const headers = `${columns.join()}\n`
    // Transform rows object into string
    const rowsString = Object.keys(rows).reduce((acc,key) => acc.concat(key,',',rows[key],'\n'),'');
    const output = headers.concat(rowsString);
    fs.writeFile(`${eventType}Custom.csv`, output, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(`The ${eventType} file was saved!`);
    }); 
}




