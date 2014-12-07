'use strict';

var gamePlay = (function (){
    //state
    var score = 0;

    //modifiers

    //actions
    var press = function (username, socket){
        socket.emit("buzz", username, function (status){
            //say if first user.
            return false;
        });
    };

}());

angular.module('buzzerApp')
    .controller('MainCtrl', function($scope, $http, socket) {
        $scope.buzzer = {};
        $scope.errormsg = "";
        $scope.buzzer.users = [];
        $scope.buzzerButton = {clicked : true, text : "Wait for round to start"};

        socket.on("server:init", function(data){
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

                //check with server if username is taken
                socket.emit("players:newuser", username,
                            function(userExists){
                                if (!userExists){
                                    $scope.errormsg = "User exists";
                                }else{
                                    $scope.myself = {name : username, score: 0, group: false};
                                    $scope.buzzer.users.push($scope.myself);
                                    localStorage.setItem("user", JSON.stringify($scope.myself));
                                    $scope.newUser = false;
                                }
                            }
                );
            }
        };

        socket.on("server:update:user", function (data){
            $scope.buzzer.users = data.users;
        });

        $scope.buzzer.killUser = function (){
            $scope.newUser = true;
            _.remove($scope.buzzer.users, function (item){
                return item.name == $scope.myself.name;
            });

            localStorage.removeItem('user');
            socket.emit("players:killuser", $scope.myself);

            $scope.myself = {};

        };
        //end user handling

        //game logic
        $scope.buzzer.buzz = function (){
            socket.emit("players:buzz", $scope.myself.name, function (res){
                if (res.first){
                    $scope.buzzer.first = true;
                    $scope.buzzerButton.text = "FIRST!"
                }else{
                    $scope.buzzerButton.text = "NOT FIRST"
                    $scope.buzzer.first = false;
                }
                $scope.buzzerButton.clicked = true;
            });
        }

        socket.on("server:newround", function(data){
            $scope.buzzerButton.text = "BUZZIT!"
            $scope.buzzerButton.clicked = false;
            $scope.buzzer.first = false;
        });


    });
