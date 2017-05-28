angular.module('muzli').factory('postsService', ['$q', '$http', '$timeout', 'settings',
    function ($q, $http, $timeout, settings) {

        // API METHODS
        return {

            getPosts: function(params) {

                var deferred = $q.defer();

                $http.get('api/posts/', {
                    params: params
                }).then(function (response) {

                    var lastFetchTime = new Date(localStorage.lastFetchTime);

                    //Set new flag if post is more recent than last time user feched content
                    angular.forEach(response.data, function(post) {
                        if (new Date(post.createdAt) > lastFetchTime) {
                            post.isNew = true;
                        }
                    })

                    deferred.resolve(response.data);
                })

                return deferred.promise;

            },
        }

    }
]);
