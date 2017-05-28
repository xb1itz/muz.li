angular.module('muzli').factory("trackingService", ['$http', '$q', 'settings',
    function ($http, $q, settings) {

        function initGA() {
            if (window.ga) {
                ga('create', settings.tracker.GA_TRACKING_CODE, 'auto');
                ga('require', 'displayfeatures');
            };
        };

        function _gaTrack(hitType, data) {
            
            if (window.ga) {

                var deffered = $.Deferred();
                var requestData = angular.extend(data, {
                    'hitType': hitType,
                    'hitCallback': function(response) {
                        deffered.resolve(response);
                    }
                });

                try {
                    window.ga('send', requestData);
                } catch (err) {
                    console.error("Google analytics error", err);
                }

            }
        };


        /*============================
        =            Init            =
        ============================*/

        var trackingApiUrl = settings.apiLocationUrl + 'tracking/REST/';
        var deferred = $q.defer(); 
        

        //Initialize Google Analytics tracking
        initGA();

        return {
            ga: {
                trackPageView: function (url, title) {
                    _gaTrack('pageview', {
                        'page': url,
                        'title': title
                    })
                },
                trackEvent: function (category, action, label, value) {
                    _gaTrack('event', {
                        'eventCategory': category,
                        'eventAction': action,
                        'eventLabel': label,
                        'eventValue': value
                    })
                },
                trackException: function(description) {
                    _gaTrack('exception', {
                        'exDescription': description
                    })
                },
                trackTiming: function(category, variable, value, label) {
                    _gaTrack('timing', {
                        'timingCategory': category,
                        'timingVar': variable,
                        'timingValue': value,
                        'timingLabel': label
                    })
                }
            }
        };
    }
]);