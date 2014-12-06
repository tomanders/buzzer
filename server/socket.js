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
        console.log(name);
        console.log(userIndex);
        if (!name || userIndex == -1) {
            return false;
        } else {
            var groupExists = _.contains(groups, group);
            if (groupExists){
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
        return 4;
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
        _.remove(users, function (item){
            return item.name == name;
        });
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
        socket.broadcast.emit('server:update:user', {
            users: users.get()
        });
    });

    socket.on('players:buzz', function (data, fn){
        console.log("we have a buzz from: " + data);
        var res = buzzBoard.registerPress(data);
        socket.broadcast.emit('server:buzz:update', buzzBoard.get());
        console.log(res);
        fn(res);
        console.log(buzzBoard.get());
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
        }
    });

    socket.on('gamemaster:wrong', function (user){
        console.log("wrong:" + user);
    });

    socket.on('gamemaster:group:adduser', function (data){
        console.log(data);
        var status = users.setGroup(data.user, data.group);
        console.log(status);
        if (status){
            console.log("emitting updated groups");
            console.log(users.get());

            socket.emit('server:update:user', {
                users : users.get()
            });
            socket.broadcast.emit('server:update:user', {
                users : users.get()
            });
        }
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
