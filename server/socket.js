var _ = require("lodash");
var buzzBoard = require("./buzzBoard");


// Keep track of which names are used so that there are no duplicates
var users = (function() {
    var users = [];
    var groups = {
        "Group 1" : [],
        "Group 2" : [],
        "Group 3" : [],
        "Group 4" : [],
        "Group 5" : []
    };

    //group handling
    var setGroup = function(name, group){
        //OBS, something is of here, when changing groups after a while
        // something goes wrong, another user gets transfered..
        // test with gamemaster and give a score and change groups several times.
        
        var userIndex = _.findIndex(users, {'name' : name});
        if (!name || userIndex == -1) {
            return false;
        } else {
            console.log(group);
            var groupExists = _.contains(_.keys(groups), group);
            var user = users[userIndex];
            
            if (groupExists){
                //check if user is in another group and remove before changing.
                if (user.group){
                    groups[user.group].pop(user);
                }
                groups[group].push(users[userIndex]);
            }else{
                groups[group] = [users[userIndex],];
            }
            users[userIndex].group = group;
            return true;
        }
    };

    var getGroups = function (){
        return groups;
    };

    var getGroupScore = function (group){
        var totals = _.mapValues(groups,
                                 function (users) {
                                     var score = _.pluck(users, 'score');
                                     var sum = _.reduce(score,
                                                        function(sum, num) {
                                                            return sum + num}
                                                       );
                                     return sum || 0
                                 }
                                );
        return totals[group];
    };
    var getGroupsScore = function (){
        return totals = _.mapValues(groups,
                                 function (users) {
                                     var score = _.pluck(users, 'score');
                                     var sum = _.reduce(score,
                                                        function(sum, num) {
                                                            return sum + num}
                                                       );
                                     return sum || 0
                                 }
                                );
    };


    //user handling
    var claim = function(name) {
        var userExists = _.findIndex(users, {'name' : name});
        if (!name || userExists !== -1) {
            return false;
        } else {
            users.push({'name' : name, 'score' : 0});
            return true;
        }
    };

    // get users with score
    var get = function() {
        return users;
    };

    var free = function(name) {
        //OBS added group leaving without testing
        var userIndex = _.findIndex(users, {'name' : name});
        if (userIndex != -1){
            var user = users[userIndex];
            if (user.group){
                groups[user.group].pop(user);
            }
            users.pop(user);
        }
    };

    var giveScore = function (score, name){
        var userIndex = _.findIndex(users, {'name' : name});

        if (!name || userIndex == -1) {
            return false;
        }

        users[userIndex].score = users[userIndex].score + score;
        console.log(users);
        return true;

    }
    return {
        claim: claim,
        free: free,
        get: get,
        setGroup : setGroup,
        getGroups : getGroups,
        getGroupScore : getGroupScore,
        getGroupsScore : getGroupsScore,
        giveScore : giveScore
    };
}());

// export function for listening to the socket
module.exports = function(socket) {
    function sendUserListUpdate(){
        
    };
    var leaderList = buzzBoard.get();
    
    
    // send the new user their name and a list of users
    socket.emit('server:init', {
        users: users.get(),
        groups : users.getGroups()
    });

    // validate a user's name, and broadcast all users on success
    socket.on('players:newuser', function(data, fn) {
        if (users.claim(data)) {
            socket.broadcast.emit('server:update:user', {
                users: users.get()
            });

            fn(true);
        } else {
            fn(false);
        }
    });

    // remove user, and broadcast all users
    socket.on('players:killuser', function(data) {
        users.free(data.name);
        socket.broadcast.emit('server:update:user', {
            users: users.get()
        });
    });

    socket.on('players:buzz', function (data, fn){
        console.log("we have a buzz from: " + data);
        var res = buzzBoard.registerPress(data);
        socket.broadcast.emit('server:buzz:update', buzzBoard.get());
        fn(res);
    });

    socket.on('gamemaster:newround', function (fn){
        buzzBoard.clearRound();
        socket.broadcast.emit('server:newround');
    });

    socket.on('gamemaster:correct', function (user){
        console.log("correct: " + user);
        var score = 10;
        var scoreGiven = users.giveScore(score, user);
        console.log("gave score: " + scoreGiven);
        console.log(users.getGroups());
        if (scoreGiven){
            socket.emit('server:update:user', {
                users : users.get()
            });
            socket.broadcast.emit('server:update:user', {
                users : users.get()
            });
            //send scoreboard to gamemaster
            socket.emit('server:score:update', users.getGroupsScore());
        }
    });

    socket.on('gamemaster:wrong', function (user){
        //what should we do if the user answers wrong?
        //buzz again?
        console.log("wrong:" + user);
    });

    socket.on('gamemaster:group:adduser', function (data){
        var status = users.setGroup(data.user, data.group);
        if (status){
            socket.emit('server:update:user', {
                users : users.get()
            });
            socket.broadcast.emit('server:update:user', {
                users : users.get()
            });
        }
    });

    socket.on('getGroupScore', function(group, fn){
        var totalScore = users.getGroupScore(group);
        fn(totalScore);
    });
    // clean up when a user leaves, and broadcast it to other users
    /*
    socket.on('disconnect', function() {
        socket.broadcast.emit('user:left', {
            name: name
        });
        users.free(name);
    });
    */
};
