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

    return {
        claim: claim,
        free: free,
        get: get,
        setGroup : setGroup
    };
}());

// export function for listening to the socket
module.exports = function(socket) {
    
    var leaderList = buzzBoard.get();

    // send the new user their name and a list of users
    socket.emit('init', {
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
    socket.on('new:user', function(data, fn) {
        if (users.claim(data)) {
            socket.broadcast.emit('update:user', {               
                users: users.get()
            });

            fn(true);
        } else {
            fn(false);
        }
    });

    // remove user, and broadcast all users
    socket.on('kill:user', function(data) {
        users.free(data.name);
        socket.broadcast.emit('update:user', {
            users: users.get()
        });
    });

    socket.on('buzz', function (data, fn){
        console.log("we have a buzz");
        var res = buzzBoard.registerPress(data);
        console.log(res);
        fn(res);
        console.log(buzzBoard.get());
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
