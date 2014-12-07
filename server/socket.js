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
        var userIndex = _.findIndex(users, {'name' : name});
        if (!name || userIndex == -1) {
            return false;
        } else {
            var groupExists = _.contains(_.keys(groups), group);
            var user = users[userIndex];
            //check if user is in another group and remove before changing.
            if (user.group){
                _.remove(groups[user.group], user);
                user.group = false;
            }
            //push and add group to user if exists, else user is groupless
            if (groupExists){
                groups[group].push(user);
                user.group = group;                
            }
            return true;
        }
    };

    var createGroup = function (group){
        var groupExists = _.contains(_.keys(groups), group);
        if (!groupExists){
            groups[group] = [];
            return true;
        }
        return false;
    }
    
    var getGroups = function (){
        return groups;
    };

    var getGroupsScore = function (){
        return totals =
            _.mapValues(groups,
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
    
    var getGroupScore = function (group){
        var totals = getGroupsScore();
        return totals[group];
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
        var userIndex = _.findIndex(users, {'name' : name});
        if (userIndex != -1){
            var user = users[userIndex];
            if (user.group){
                _.remove(groups[user.group], user);
            }
            _.remove(users, user);
        }
    };

    var giveScore = function (score, name){
        var userIndex = _.findIndex(users, {'name' : name});

        if (!name || userIndex == -1) {
            return false;
        }

        users[userIndex].score = users[userIndex].score + score;
        return true;

    }
    return {
        claim: claim,
        free: free,
        get: get,
        createGroup : createGroup,
        setGroup : setGroup,
        getGroups : getGroups,
        getGroupScore : getGroupScore,
        getGroupsScore : getGroupsScore,
        giveScore : giveScore
    };
}());

// export function for listening to the socket
module.exports = function(socket) {
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
        buzzBoard.killUser(data.name);
        console.log(buzzBoard.get());
        socket.broadcast.emit('server:buzz:update', buzzBoard.get());
        socket.broadcast.emit('server:update:user', {
            users: users.get()
        });
        //send scoreboard to gamemaster
        socket.broadcast.emit('server:score:update', users.getGroupsScore());

    });

    socket.on('players:buzz', function (data, fn){
        var res = buzzBoard.registerPress(data);
        socket.broadcast.emit('server:buzz:update', buzzBoard.get());
        //trigger callback with first buzz or not
        fn(res);
    });

    socket.on('gamemaster:newround', function (fn){
        buzzBoard.clearRound();
        socket.broadcast.emit('server:newround');
    });

    socket.on('gamemaster:correct', function (user){
        var score = 10;
        var scoreGiven = users.giveScore(score, user);
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
            //send scoreboard to gamemaster
            socket.emit('server:score:update', users.getGroupsScore());
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
