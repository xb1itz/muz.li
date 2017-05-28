angular.module('muzli').config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        //Redirect to index state from any invalid stare
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('index', {
                url: '/',
                controller: 'indexController',
                templateUrl: 'views/posts.html'
            })
            .state('feed', {
                url: '/{feed}',
                controller: 'indexController',
                templateUrl: 'views/posts.html'
            })

    }
]);
