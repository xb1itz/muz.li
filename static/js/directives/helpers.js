angular.module('muzli').directive('scrollEvents', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attributes) {

            var preloadOffsetRatio = 2;
            var customScrollbar = false;
            var scrollTimeout;
            var wheelTimeout;
            var wrapper;
            var container;
            var customScrollbarContainer;

            var _initScrollEvents = function() {

                $(wrapper).scroll(function(event) {

                    if (!!scrollTimeout) {
                        clearTimeout(scrollTimeout);
                    }

                    scrollTimeout = setTimeout(function() {
                        $scope.checkScrollPosition();
                    }, 200);
                });

                $(wrapper).bind('mousewheel', function(event) {

                    if (!!scrollTimeout) {
                        clearTimeout(scrollTimeout);
                    }

                    if (event.originalEvent.wheelDelta / 120 < 0) {

                        if (!wheelTimeout) {

                            $scope.checkScrollPosition();

                            wheelTimeout = setTimeout(function() {
                                clearTimeout(wheelTimeout);
                                wheelTimeout = false;
                            }, 500);
                        }
                    }
                });
            };

            $scope.checkScrollPosition = function() {

                var scrolledOffset = (wrapper === window) ? window.scrollY : container.scrollTop
                var offsetBottom = container.scrollHeight - container.clientHeight;

                //Compensate for scrolled distance
                offsetBottom -= scrolledOffset;

                //Compensate for custom scrollbar working with absolute positioning
                offsetBottom += customScrollbarContainer ? customScrollbarContainer.position().top : 0;

                if (offsetBottom < preloadOffsetRatio * container.clientHeight) {
                    $scope.$broadcast('scrollAtBottom');
                }
            };

            $scope.initScrollEvents = function() {

                if ($element.parents('.mCustomScrollBox').length) {
                    customScrollbar = true;
                    container = $element.parents('.mCustomScrollBox').get(0);
                    customScrollbarContainer = $element.parent();
                    wrapper = container;
                }

                _initScrollEvents();
            };


            /*============================
            =            Init            =
            ============================*/

            //Manual init
            if ($attributes.scrollEventsInit === 'manual') {
                return;
            };

            //Window level scroll
            if ($attributes.scrollEventsInit === 'window') {
                
                wrapper = window;
                container = $('body').get(0);

                _initScrollEvents();

                return;
            };

            //Auto init
            container = $element.parent().get(0);

            if ($(container).is('body')) {
                wrapper = window;
            } else {
                wrapper = container;
            }

            _initScrollEvents();
            
        }
    }
}]);

