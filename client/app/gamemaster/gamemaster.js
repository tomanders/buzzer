'use strict';

angular.module('buzzerApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/gamemaster', {
        templateUrl: 'app/gamemaster/gamemaster.html',
        controller: 'GamemasterCtrl'
      });
  });
