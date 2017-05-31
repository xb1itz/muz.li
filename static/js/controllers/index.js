angular.module('muzli').controller('indexController', ['$scope', '$state', '$q', '$rootScope', '$timeout', 'postsService',
    function ($scope, $state, $q, $rootScope, $timeout, postsService) {

        //Private functions
        var getFetchParams = function () {
            return angular.extend($scope.filter, {
                offset: $scope.page * $scope.pageSize,
                limit: $scope.pageSize,
                feed: $state.params.feed,
            });
        };


        $scope.initList = function () {
            $scope.isLastItemLoaded = false;
            $scope.isListEmpty = false;
            $scope.enableInfiniteScroll = true;
            $scope.limit = 10; //Use for preloading more data than it is rendered
            $scope.page = 0;
            $scope.posts = [];
        };

        $scope.loadPosts = function (fetchParams) {

            if ($scope.isFechingInProgress) {
                return;
            };

            if ($scope.isLastItemLoaded) {
                return;
            }

            $scope.isFechingInProgress = true;

            postsService.getPosts(fetchParams).then(function (response) {

                var posts = response.rows || response;

                $scope.count = response.count;
                $scope.posts.push.apply($scope.posts, posts);

                //Increase list render limit to show all posts
                if ($scope.page > 1) {
                    $scope.limit = $scope.posts.length;
                }

                //Set empty posts flag if user doesn't have any posts yet
                if (!$scope.posts.length) {
                    $scope.isListEmpty = true;
                }

                //Set flag for last item loaded
                if (!posts || !posts.length) {
                    $scope.isLastItemLoaded = true;
                }

                //Set flag indicating initial loading is complete
                $scope.isLoadingComplete = true;
                $scope.page++;

                $timeout(function () {

                    //Set timestamp when last time user feched any content to display 'new' indicators 
                    localStorage.lastFetchTime = new Date();

                    $scope.isFechingInProgress = false;
                    $scope.checkScrollPosition();
                });

            });
        };


        /*============================
        =            Init            =
        ============================*/

        console.log('Index controller init');

        $rootScope.setPageTitle('Muzli | Demo newsfeed');

        $scope.isFechingInProgress = false;
        $scope.isLoadingComplete = false;
        $scope.pageSize = 10;
        $scope.filter = {
            order: 'recent'
        };


        $scope.initList();

        $scope.$on('scrollAtBottom', function () {
            if ($scope.enableInfiniteScroll) {
                $scope.loadPosts(getFetchParams());
            }
        });

        //Initialize watcher check ordering toggles
        $scope.$watch('filter.order', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.initList();
                $scope.loadPosts(getFetchParams());
            }
        });


        $scope.loadPosts(getFetchParams());

        //Reset scroll position on each load
        $("html, body").animate({ scrollTop: 0 });

    },
]);

