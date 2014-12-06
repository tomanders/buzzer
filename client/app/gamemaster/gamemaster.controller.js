'use strict';

angular.module('buzzerApp')
    .controller('GamemasterCtrl', function ($scope, socket) {
        $scope.users = [];
        $scope.gamemaster = {};
        $scope.buzzqueue = [];

        socket.on("server:init", function(data){
            $scope.users = data.users;
        });

        socket.on("server:update:user", function (data){
            $scope.users = data.users;            
        });

        socket.on('server:buzz:update', function(data){
            $scope.buzzqueue = data;
        });
        
        $scope.gamemaster.startRound = function (){
            socket.emit("gamemaster:newround");
            $scope.buzzqueue = [];
        };

        $scope.gamemaster.correct = function (user){            
            socket.emit("gamemaster:correct", user);
        }

        $scope.gamemaster.wrong = function (user){            
            socket.emit("gamemaster:wrong", user);
        }

    });
