'use strict';

angular.module('buzzerApp')
    .controller('GamemasterCtrl', function ($scope, socket) {
        var groupData = {};
        $scope.users = [];
        $scope.gamemaster = {};
        $scope.buzzqueue = [];
        $scope.roundButtonText = "Start round!";
        $scope.groups = {};
        $scope.groups.registered = $scope.groups.scoreboard = {};

        socket.on("server:init", function(data){
            $scope.users = data.users;
            $scope.groups.registered = _.keys(data.groups);
            groupData = data.groups;
        });

        socket.on("server:update:user", function (data){
            $scope.users = data.users;
        });

        socket.on('server:buzz:update', function(data){
            $scope.buzzqueue = data;
        });

        socket.on('server:score:update', function(score){
            $scope.groups.scoreboard = score;
        });

        $scope.gamemaster.startRound = function (){
            socket.emit("gamemaster:newround");
            $scope.buzzqueue = [];
            $scope.roundButtonText = "Next round";
        };

        $scope.gamemaster.correct = function (user){
            socket.emit("gamemaster:correct", user);
        };

        $scope.gamemaster.wrong = function (user){
            socket.emit("gamemaster:wrong", user);
        };

        $scope.gamemaster.newGroup = function(){
            socket.emit("gamemaster:addgroup", $scope.groups.newgroup, function(status){
                if (status){
                    $scope.groups.registered.push($scope.groups.newgroup);
                    $scope.groups.newgroup = "";                    
                }
                    
            });
        };

        $scope.gamemaster.addToGroup = function (user){
            socket.emit("gamemaster:group:adduser", {
                group : user.group,
                user : user.name
            });
        };



    });
