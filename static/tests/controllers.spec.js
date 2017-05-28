describe('Test for controllers', function() {

    var $controller;
    var $rootScope;
    var $httpBackend;

	beforeEach(module('refound'));

	beforeEach(inject(function(_$controller_, _$rootScope_, $injector){
		// The injector unwraps the underscores (_) from around the parameter names when matching
        $httpBackend = $injector.get('$httpBackend');
        $controller = _$controller_;
        $rootScope = _$rootScope_;
    }));

    it('Managers controller should do something', function() {

        var $scope = {};
        var controller = $controller('managersController', { 
            $scope: $scope 
        });

        console.log('Yey!');

    });


});
