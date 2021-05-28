/*
    Get a list of custom attributes
    The generated report is useful to detect all custom attributes added
    to the default events and which applications(teams) are using them.
    This report will help identifying a list of best practises for naming
    custom attributes.

    Certain tables are commented out because adding AWS, GCP or Azure telementry adds custom attributes

    Rewriter: Patsy Price
    Team: Team Shaw
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
const ajaxRequest = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','browserInteractionId','browserInteractionName','city','countryCode',
    'deviceType','eventId','groupedPageUrl','groupedRequestUrl','hostname','httpMethod','httpResponseCode','jsDuration','pageUrl',
    'parentEventId','port','priority','regionCode','requestBodySize','responseBodySize','requestUrl','session','timeSinceBrowserInteractionStart','timestamp',
    'timeToLastCallbackEnd','timeToLoadEventStart','timeToSettle','userAgentName','userAgentOS','userAgentVersion'];

const awslambdainvocation = ['aws.lambda.arn','aws.lambda.coldStart','aws.lambda.eventSource.arn','aws.requestId','databaseCallCount','databaseDuration',
      'duration','externalCallCount','newRelic.ingestPoint','parent.account','parent.app','parent.transportType','parent.type','request.headers.accept',
      'request.headers.contentLength','request.headers.contentType','request.headers.referer','request.headers.userAgent','request.method','response.headers.contentLength',
      'response.headers.contentType','response.status','totalTime','traceId','type','timestamp']

const awslambdainvocationerror = ['aws.lambda.arn','aws.lambda.cold','aws.lambda.eventSource.arn','aws.requestId','databaseCallCount','databaseDuration',
    'duration','error.class','error.message','externalCallCount','externalDuration','newRelic.ingestPoint','parent.account','parent.app','parent.transportType',
    'parent.type','request.headers.accept','request.headers.contentLength','request.headers.host','request.headers.referer','request.headers.userAgent',
    'request.method','response.headers.contentLength','response.headers.contentType','stackTrace','traceId','transactionName','type','timestamp']

const browserinteraction = ['actionText','ajaxCount','appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','backendTransactionName',
    'browserInteractionId','browserInteractionName','category','city','countryCode','deviceType','domain','duration','eventId','firstContentfulPaint','firstPaint',
    'jsDuration','monitorAccountId','monitorId','monitorJobId','parentEventId','previousGroupedUrl','previousRouteName','previousUrl','regionCode','session',
    'targetGroupedUrl','targetRouteName','targetUrl','timestamp','timeToConnectEnd','timeToConnectStart','timeToDomainLookupEnd','timeToDomainLookupStart',
    'timeToDomComplete','timeToDomContentLoadedEventEnd','timeToDomContentLoadedEventStart','timeToDomInteractive','timeToDomLoading','timeToFetchStart',
    'timeToLoadEventEnd','timeToLoadEventStart','timeToRedirectEnd','timeToRedirectStart','timeToRequestStart','timeToResponseEnd','timeToResponseStart',
    'timeToSecureConnectionStart','timeToUnloadEventEnd','timeToUnloadEventStart','timestamp','trigger','userAgentName','userAgentOS','userAgentVersion'];

const browsertiming = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','browserInteractionId','browserInteractionName','browserTimingName',
     'city','countryCode','deviceType','eventId','groupedPageUrl','jsDuration','pageUrl','parentEventId','regionCode','session','timeSinceBrowserInteractionStart',
     'timeToLastCallbackEnd','timeToSettle','timeToTracedCallbackStart','timestamp','tracedCallbackDuration','userAgentName','userAgentOS','userAgentVersion']

const containersample = ['StorageDataAvailableBytes','StorageDatTotalBytes','StorageDataUsagePercent','StorageDataUsedBytes','StorageMetadataAvailableBytes',
      'StorageMetadataTotalBytes','StorageMetadataUsagePercent','StorageMetadataUsedBytes','commandLine','containerId','cpuKernalPercent','cpuLimitCores','cpuPercent',
      'cpuShares','cpuThrottlePeriods','cpuThrottleTimeMs','cpuUsedCoresPercent','cpuUserPercent','criticalViolationCount','image','imageName','memoryCacheBytes',
      'memoryKernelUsageBytes','memoryResidentSizeBytes','memorySizeLimitBytes','memorySoftLimitBytes','memorySwapLimitBytes','memorySwapLimitUsagePercent',
      'memorySwapOnlyUsageBytes','memorySwapUsageBytes','memoryUsageBytes','memoryUsageLimitPercent','name','networkRxBytes','networkRxBytesPerSecond','networkRxDropped',
      'networkRxDroppedPerSecond','networkRxError','networkRxErrorsPerSecont','networkRxPackets','networkRxPacketsPerSecond','networkTxBytesPerSecond','networkTxDropped',
      'networkTxDroppedPerSecond','networkTxErrors','networkTxErrorsPerSecond','networkTxPackets','networkTxPacketsPerSecond','networksTxBytes','restartCount','state',
      'status','timestamp','warningViolationCount']

const distributedtracesummary = ['accountIds','backend.duration.ms','backend.timestamp','duration.ms','entityCount','entityGuids','errorCount','entrySpanErrorCount','newRelic.traceFilter.type',
      'root.entity.accountId','root.entity.guid','root.entity.name','root.span.duration.ms','root.span.eventType','root.span.id','root.span.name','root.span.process.name','root.span.timestamp','spanCount',
      'timestamp','trace.id']


const infrastructureevent = ['category','changeType','changedPath','deltaId','eventId','format','newStatus','newValue','oldValue','provider','source','summary',
      'violationUpdateType']

const javaScriptError = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','browserInteractionId','browserStackHash','city','countryCode','domain',
    'deviceType','entityGuid','errorClass','errorMessage','firstErrorInSession','monitorAccountId','monitorId','monitorJobId','pageUrl','parentEventId','regionCode',
    'releaseIds','requestUri','session','stackHash','stackTrace','stackTraceGzip','sessionId','timestamp','transactionName','userAgentName','userAgentOS','userAgentVersion'];


const mobile = ['category','interactionDuration','name','reportedTimestampMs','timestamp']

const mobilecrash = ['appBuild','appId','appName','appToken','appVersion','appVersionId','architecture','asnOwner','bundleId','carrier','crashException','crashFingerprint',
      'crashLocationFile','crashMessage','deviceManufacturer','deviceModel','deviceName','deviceUuid','diskAvailable','interactionHistory','isFirstOcurrence','lastInteraction',
      'memUsageMB','modelNumber','networkStatus','newRelicVersion','occurenceId','orientation','osMajorVersion','osName','osVersion','parentProcess','parentProcessId','platform',
      'processId','processName','processPath','reportedTimestampMs','runtime','sessionCrashed','sessionId','symbolicated','timeSinceLastInteraction','timestamp','userImageUuids','uuid']

const mobilehandledexception = ['appBuild','appName','appVersion','appVersionId','asn','asnOwner','carrier','city','countryCode','device','deviceManufacturer','deviceModel','deviceType',
      'deviceUuid','exceptionAppBuildUuid','exceptionCause','exceptionLocation','exceptionLocationClass','exceptionLocationFile','exceptionLocationLibraryOffset','exceptionLocationLine',
      'exceptionMessage','exceptionName','fingerprint','handledExceptionUuid','lastInteraction','libraryName','libraryStartAddr','memUsageMB','newRelicVersion','occurenceTimestamp',
      'osBuild','osMajorVersion','osName','osVersion','platform','regionCode','runTime','sessionId','timestamp','uuid']

const mobilerequest = ['appBuild','appId','appName','appVersion','appVersionId','asn','asnOwner','bytesReceived','bytesSent','carrier','connectionType','countryCode','device',
      'deviceGroup','deviceManufacturer','deviceModel','deviceSize','deviceType','duration','guid','lastInteraction','memUsageMB','newRelicVersion','osMajorVersion','osName',
      'osVersion','platform','regionCode','requestDomain','requestFingerprint','requestMethod','requestPath','requestUrl','requestUuid','responseTime','sessionId','statusCode',
      'timestamp','trace.id','traceId','uuid']

const mobilerequesterror = ['appBuild','appId','appName','appVersion','appVersionId','asn','asnOwner','bytesReceived','bytesSent','carrier','connectionType','countryCode','device',
      'deviceGroup','deviceManufacturer','deviceModel','deviceSize','deviceType','deviceUuid','duration','errorType','guid','lastInteraction','memUsageMB','networkError','networkErrorCode',
      'newRelicVersion','osMajorVersion','osName','osVersion','platform','regionCode','requestDomain','requestErrorFingerprint','requestMethod','requestPath','requestUrl','requestUuid',
      'responseBody','responseTime','sessionId','statusCode','timestamp','trace.id','traceId','uuid']

const mobilesession = ['appBuild','appId','appName','appVersion','appVersionId','asn','asnOwner','bundleId','carrier','city','countryCode','device','deviceGroup','deviceManufacturer',
      'deviceModel','deviceType','deviceUuid','install','lastInteraction','memUsageMB','newRelicAgent','newRelicVersion','osMajorVersion','osName','osVersion','platform','regionCode',
      'sessionCrashed','sessionDuration','sessionId','timeSinceLoad','timestamp','upgradeFrom','uuid']

const networksample = ['agentName','agentVersion','criticalViolationCount','entityID','fullHostname','hardwareAddress','hostname','interfaceName','ipV4Address','ipV6Address',
      'kernelVersion','linuxDistribution','operatingSystem','receiveBytesPerSecond','receiveDroppedPerSecond','receiveErrorsPerSecond','receivePacketsPerSecond','state',
      'timestamp','transmitBytesPerSecond','transmitDroppedPerSecond','transmitErrorsPerSecond','transmitPacketsPerSecond','warningViolationCount','windowsFamily',
      'windowsPlatform','windowsVersion']

const pageAction = ['actionName','appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','browserHeight','browserWidth','city',
      'countryCode','currentUrl','deviceType','name','pageUrl','referrerUrl','regionCode','session','timeSinceLoad','timestamp','userAgentName','userAgentOS','userAgentVersion'];

const pageView = ['appId','appName','asn','asnLatitude','asnLongitude','asnOrganization','backendDuration','browserTransactionName',
     'city','connectionSetupDuration','countryCode','deviceType','dnsLookupDuration','domain','domProcessingDuration','duration','firstContentfulPaint','firstPaint','name',
     'networkDuration','pageRenderingDuration','pageUrl','queueDuration','regionCode','secureHandshakeDuration','session','timestamp','userAgentName',
     'userAgentOS','userAgentVersion','webAppDuration'];

const pageviewtiming = ['appId','appName','asn','asnLongitude','asnLatitude','asnOrganization','browserTransactionName','city','countryCode','deviceType','domain',
      'domain','elementId','elementSize','firstContentfulPaint','firstInputDelay','firstInteraction','firstPaint','interactionType','largestContenfulPaint','pageUrl',
      'regionCode','session','timestamp','timingName','userAgentName','userAgentOS','userAgentVersion','windowLoad','windowUnload']

const processsample = ['agentName','agentVersion','commandLine','commandName','contained','containerId','containerImage','containterImageName','containerLabel_KEY','containerName',
      'cpuPercent','cpuUserPercent','criticalViolationCount','entityID','fullHostname','hostname','ioReadBytesPerSecond','ioReadCountPerSecond','ioTotalReadBuytes','ioTotalReadCount',
      'ioTotalWriteBytes','ioTotalWriteCount','ioWriteBytesPerSecond','ioWriteCountPerSecond','kernelVersion','linuxDistribution','memoryResidentSizeBytes','memoryVirtualSizeBytes',
      'netIoTotalReceivedPackets','netIoTotalSentPackets','operatingSystem','parentProcessId','processDisplayName','processId','state','threadCount','timestamp','userId','userName',
      'warningViolationCount','windowsFamily','windowsPlatform','windowsVersion']


const span = ['appId','appName','asn','asnLongitude','asnLatitude','asnOrganization','browserApp.name','browserInteraction.Id','browserInteraction.name','bytes.received',
      'bytes.sent','category','component','connection.type','containerId','db.instance','db.statement','device.size','device.type','duration','duration.ms','entityGuid',
      'entity.name','error','error.class','error.message','error.statusCode','error.type','geo.city','geo.countryCode','geo.regionCode','groupedPageUrl','groupedRequestUrl',
      'guid','host','http.method','http.url','jsDuration.ms','mobileApp.name','name','networkError','networkError.code','newRelic.ingestPoint','newRelic.traceFilter.type',
      'pageUrl','parentId','peer.address','peer.hostname','port','priority','realAgentId','request.bodySize','request.domain','request.method','request.path','request.url',
      'response.body','response.bodySize','response.statusCode','sampled','service.name','session','span.kind','timeSinceBrowserInteractionStart.ms','timeToLastCallbackEnd.ms',
      'timeToLoadEventStart.ms','timeToSettle.ms','timestamp','trace.id','traceId','transaction.name','transactionId','userAgent.name','userAgent.os','userAgent.version']

const storagesample = ['agentName','agentVersion','avgQueueLen','avgReadQueueLen','avgWriteQueueLen','criticalViolationCount','currentQueueLen','device','diskFreeBytes','diskFreePercent',
      'diskTotalBytes','diskUsedBytes','diskUsedPercent','entityAndMountPoint','entityID','filesystemType', 'fullHostname','hostname','inodesFree','inodesTotal','inodesUsed',
      'inodesUsedPercent','isReadOnly','windowsFamily','windowsPlatform','windowsVersion','ioWriteBytesPerSecond','writeIoPerSecond','writeUtilizationPercent']


const syntheticrequest = ['URL','checkId','contentCategory','contentType','domComplete','domContentLoadedEventEnd','domContentLoadedEventStart','domInteractive','domain','duration','durationBlocked',
      'durationConnect','durationDNS','durationReceive','durationSSL','durationSend','durationWait','entityGuid','externalResource','firstContentfulPaint','firstPaint','hierarchicalURL','host',
      'id','isAjax','isNavigationRoot','jobId','loadEventEnd','loadEventStart','location','locationLabel','longRunningTasksAvgTime','longRunningTasksCount','longRunningTasksMaxTime','longRunningTasksMinTime',
      'minion','minionId','minionJobsReceived5MinRate','minionJobsSkipped5MinRate','monitorId','monitorName','nr.durationConnectV2','onPageContentLoad','onPageLoad','pageref','parentId','path','port','requestBodySize',
      'requestHeaderSize','responseBodySize','responseCode','responseHeaderSize','responseStatus','serverIPAddress','sslCertificateExpirationMs','sslCertificateExpirationDaysRemaining','timestamp','unloadEventEnd',
      'unloadEventStart','verb']

const synthenticprivatelocationstatus = ['checksPending','name','timestamp']

const syntheticsprivateminion = ['minionArchitecture','minionBuildNumber','minionContainerSystemVersion','minionDockerVer','minionHostname','minionId','minionIpv4','minionIsContainerized','minionIsPrivate',
      'minionJobsFailed','minionJobsFailed5minRate','minionJobsFinished','minionJobsFinished15MinRate','minionJobsFinished1MinRate','minionJobsFinished5MinRate','minionJobsInternalEngineError',
      'minionJobsInternalEngineError15MinRate','minionJobsInternalEngineError1MinRate','minionJobsInternalEngineError5MinRate','minionJobsQueued','minionJobsQueued15MinRate','minionJobsQueued1MinRate',
      'minionJobsQueued5MinRate','minionJobsReceived','minionJobsReceived15MinRate','minionJobsReceived1MinRate','minionJobsReceived5MinRate','minionJobsRunning','minionJobsSkipped','minionJobsSkipped15MinRate',
      'minionJobsSkipped1MinRate','minionJobsSkipped5MinRate','minionJobsTimedOut','minionJobsTimedOut15MinRate','minionJobsTimedOut1MinRate','minionJobsTimedOut5MinRate','minionLocation','minionLocationIsPrivate',
      'minionOsName','minionOsVersion','minionPhysicalMemoryFreeBytes','minionPhysicalMemoryFreePercentage','minionPhysicalMemoryTotalBytes','minionPhysicalMemoryUsedBytes','minionPhysicalMemoryUsedPercentage',
      'minionProcessors','minionProcessorsFrequencyGHz','minionProcessorsUsagePercentage','minionProvidor','minionStartTimestamp','minionSwapMemoryFreeBytes','minionSwapMemoryFreePercentage','minionSwapMemoryTotalBytes',
      'minionSwapMemoryUsedBytes','minionSwapMemoryUsedPercentage','minionSystemUptimeMs','minionUptimeMs','minionVmName','minionVmSpecVersion','minionVnmUptimeMs','minionVmVendor','minionVmVersion','minionWorkers',
      'timestamp']

const systemsample = ['MemoryFreePercent','agentName','agentVersion','cpuIdlePercent','cpuIoWaitPercent','cpuPercent','cpuStealPercent','cpuSystemPercent','cpuUserPercent',
      'criticalViolationCount','diskFreeBytes','diskFreePercent','diskReadUtilizationPercent','diskReadsPerSecond','diskTotalBytes','diskUsedBytes','diskUsedPercent','diskUtilizationPercent',
      'diskWritesPerSecond','entityID','fullHostname','i','kernelVersion','linuxDistribution','loadAverageFifteenMinute','loadAverageFiveMinute','loadAverageOneMinute','memoryFreeBytes',
      'memoryTotalBytes','memoryUsedBytes','operatingSystem','swapFreeBytes','swapTotalBytes','swapUsedBytes','timestamp','warningViolationCount','windowsFamily','windowsPlatform','windowsVersion']

const workloadstatus = ['entity.name','statusValue','statusValueCode','timestamp','workloadGuid']


getCustomAttrByApp('AjaxRequest', ajaxRequest);
getCustomAttrByApp('AwsLambdaInvocation',awslambdainvocation);
getCustomAttrByApp('AwsLambdaInvocationError',awslambdainvocationerror);
getCustomAttrByApp('BrowserInteraction', browserinteraction);
getCustomAttrByApp('BrowserTiming',browsertiming);
getCustomAttrByApp('ContainerSample',containersample);
getCustomAttrByApp('DistributedTraceSummary',distributedtracesummary);
// getCustomAttrByApp('InfrastructureEvent',infrastructureevent);
getCustomAttrByApp('JavaScriptError', javaScriptError);
getCustomAttrByApp('Mobile',mobile);
getCustomAttrByApp('MobileCrash',mobilecrash);
getCustomAttrByApp('MobileHandledException',mobilehandledexception);
getCustomAttrByApp('MobileRequest',mobilerequest);
getCustomAttrByApp('MobileRequestError',mobilerequesterror);
getCustomAttrByApp('MobileSession',mobilesession);
// getCustomAttrByApp('NetworkSample',networksample);
getCustomAttrByApp('PageAction', pageAction);
getCustomAttrByApp('PageView', pageView);
getCustomAttrByApp('PageViewTiming',pageviewtiming);
// getCustomAttrByApp('ProcessSample',processsample);
getCustomAttrByApp('Span',span);
// getCustomAttrByApp('StorageSample',storagesample);
getCustomAttrByApp('SyntheticRequest',syntheticrequest);
getCustomAttrByApp('SynthenticPrivateLocationStatus',synthenticprivatelocationstatus);
getCustomAttrByApp('SyntheticsPrivateMinion',syntheticsprivateminion);
// getCustomAttrByApp('SystemSample',systemsample);
getCustomAttrByApp('WorkLoadStatus',workloadstatus);


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
