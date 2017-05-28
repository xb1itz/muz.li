describe('Directive test', function() {

    var $compile;
    var $rootScope;
    var $httpBackend;

    beforeEach(module('refound'));

	beforeEach(inject(function(_$compile_, _$rootScope_, $injector){
		// The injector unwraps the underscores (_) from around the parameter names when matching
        $httpBackend = $injector.get('$httpBackend');
        $compile = _$compile_;
        $rootScope = _$rootScope_;

        //Mock service requests
        $httpBackend.when('GET', /api\/.*/).respond({});

    }));

    describe('Sorry no directives...', function() {
        
        it('This directive should do simething', function() {

            var e = angular.element('<span>This is awesome</span>');
            $compile(e)($rootScope);

            expect(e.html()).toContain("This is awesome");

        });

    });
});
