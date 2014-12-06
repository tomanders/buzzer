var _ = require("lodash");

// Keep track of which names are used so that there are no duplicates
var users = (function() {
    var users = [];
    
    var claim = function(name) {
        var userExists = _.findIndex(users, {'name' : name});
        console.log(users);
        console.log(userExists);
        if (userExists !== -1) {
            console.log("user exists");
            return false;
        } else {
            users.push({'name' : name});
            console.log(users);
            return true;
        }
    };


    // serialize claimed names as an array
    var get = function() {        
        return users;
    };

    var free = function(name) {
        console.log(users);
        _.remove(users, function (item)
                 {
                     return item.name == name;
                 });
        console.log(users);        
    };

    return {
        claim: claim,
        free: free,
        get: get
    };
}());

// export function for listening to the socket
module.exports = function(socket) {
    // send the new user their name and a list of users
    socket.emit('init', {
        users: users.get()
    });

    // notify other clients that a new user has joined
    //socket.broadcast.emit('user:join', {
    //    name: name
    //});

    // broadcast a user's message to other users
    socket.on('send:message', function(data) {
        socket.broadcast.emit('send:message', {
            user: name,
            text: data.message
        });
    });

    // validate a user's name change, and broadcast it on success
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

    socket.on('kill:user', function(data) {
        users.free(data.name);
        socket.broadcast.emit('update:user', {
            users: users.get()
        });
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
