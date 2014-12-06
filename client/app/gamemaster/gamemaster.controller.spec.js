'use strict';

describe('Controller: GamemasterCtrl', function () {

  // load the controller's module
  beforeEach(module('buzzerApp'));

  var GamemasterCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    GamemasterCtrl = $controller('GamemasterCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
