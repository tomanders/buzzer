'use strict';

angular.module('buzzerApp')
    .controller('MainCtrl', function($scope, $http, socket) {
        $scope.buzzer = {};
        $scope.errormsg = "";
        $scope.buzzer.users = [];

        socket.on("init", function(data){
            $scope.buzzer.users = data.users;
        });

        //user handling
        //check if new user
        var user = localStorage.getItem("user");
        $scope.newUser = true;
        $scope.myself = {};
        if (user){
            $scope.newUser = false;
            $scope.myself = JSON.parse(user);            
        }
        
        $scope.buzzer.registerNewUser = function (){
            if ($scope.newUser){
                var username = $scope.buzzer.newUser
                //socket.emit("new:user", $scope.myself);
                socket.emit("new:user", username,
                            function(userExists){
                                if (!userExists){
                                    $scope.errormsg = "User exists";
                                }else{
                                    $scope.myself = {name : username};
                                    $scope.buzzer.users.push($scope.myself);
                                    localStorage.setItem("user", JSON.stringify($scope.myself));
                                    $scope.newUser = false;
                                }
                            }
                );
            }            
        };

        socket.on("update:user", function (data){
            $scope.buzzer.users = data.users;            
        });
        
        $scope.buzzer.killUser = function (){
            $scope.newUser = true;
            _.remove($scope.buzzer.users, function (item){
                return item.name == $scope.myself.name; 
            });
            
            localStorage.removeItem('user');
            socket.emit("kill:user", $scope.myself);

            $scope.myself = {};            
            
        };
        //end user handling
        
    });
