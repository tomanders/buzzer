var _ = require("lodash");
var buzzBoard = require("./buzzBoard");


// Keep track of which names are used so that there are no duplicates
var users = (function() {
    var users = [];
    var groups = {};

    //group handling
    var setGroup = function(name, group){
        var userExists = _.findIndex(users, {'name' : name});
        if (!name || userExists !== -1) {
            return false;
        } else {
            var groupExists = _.contains(groups, group);
            if (groupExists){
                groups[group].push({'name' : name, 'score' : 0});
            }else{
                groups[group] = [{'name' : name, 'score' : 0}];
            }
            return true;
        }        
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
        giveScore : giveScore
    };
}());

// export function for listening to the socket
module.exports = function(socket) {
    
    var leaderList = buzzBoard.get();

    // send the new user their name and a list of users
    socket.emit('server:init', {
        users: users.get()
    });

    // broadcast a user's message to other users
    socket.on('send:message', function(data) {
        socket.broadcast.emit('send:message', {
            user: name,
            text: data.message
        });
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
