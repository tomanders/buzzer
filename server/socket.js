var _ = require("lodash");
var buzzBoard = require("./buzzBoard");
var users = require("./players");

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

    socket.on('gamemaster:addgroup', function(name, fn){
        var ok = users.createGroup(name);
        if (ok){
            socket.emit('server:score:update', users.getGroupsScore());
            fn(true);
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
