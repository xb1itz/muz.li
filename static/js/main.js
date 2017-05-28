'use strict';

var muzli = angular.module('muzli', [

    //Third party modules
    'ui.router'

]);

//Disable autoscroll to anchor points when switching states
muzli.value('$anchorScroll', angular.noop);

//Initial applicaton config
muzli.config(['$httpProvider', '$locationProvider', 'settings',
    function($httpProvider, $locationProvider, settings) {

        // Intercept template URL and add anticache patameters
        $httpProvider.interceptors.push(['$q', '$injector', '$rootScope',
            function ($q, $injector, $rootScope) {
                return {
                    'request': function(config) {

                        if (config.url.indexOf('api') === 0) {
                            config.url = settings.apiUrl + config.url;
                        }

                        if (config.url.indexOf('views') !== -1) {
                            config.url = config.url + '?v=' + settings.version;
                        }

                        return config || $q.when(config);
                    },

                    'response': function(response) {

                        var deferred = $q.defer();
                        var type = response.headers()['content-type'] || '';

                        if (type.indexOf('json') > -1 && response.data.hasOwnProperty('success')) {

                            if (response.data.success) {

                                if (response.data.data) {
                                    response.data = response.data.data;
                                }

                                return response;

                            } else {

                                console.error(response.config.url, response.data);
                                return $q.reject(response);
                            }

                        } else {
                            return response;
                        }

                    },

                    'responseError': function(response) {

                        var $state = $injector.get('$state');
                        // var userService = $injector.get('userService');

                        switch (response.status) {

                            //If user not authorised
                            case 401:                                
                                // userService.setUserLoggedOut(); 
                                $state.go('login');
                                console.info('User not authorised');
                                break;

                            //If resource not found (or wrong brand is selected)
                            case 404:
                                $state.go('^');
                                console.info('Resource not found')
                                break;

                            //410 response means session was destroyed intentionaly and complete reload is required
                            case 410:
                                window.location = '/';
                                break;

                            //If any other error status
                            default: 
                                console.error(response);

                        }

                        return $q.reject(response);
                    }
                };
            }
        ]);

        //Enable credentials for CORS api calls
        $httpProvider.defaults.withCredentials = true;

        //Remove hash from URL
        $locationProvider.html5Mode(true);

        //Log version
        console.info('Current version: ' + settings.version);

    }
]);

// Load global user settings
muzli.run(['$rootScope', '$q', '$state', '$stateParams', '$timeout', 'trackingService', 
    function($rootScope, $q, $state, $stateParams, $timeout, trackingService) {

        //Initial globals
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

            $rootScope.$state = $state;
            $rootScope.$stateParams = $state.params;

            console.log('State changed to: ' + toState.name);
        });

        $rootScope.setPageTitle = function (title) {

            $rootScope.pageTitle = title;

            $timeout(function() {
                trackingService.ga.trackPageView($state.current.name);
            });
        };

    }
]);

/*======================================================
=            Bootstrap Angular App manually            =
======================================================*/
angular.element().ready(function() {
    angular.bootstrap(document, ['muzli']);
});