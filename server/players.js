// Keep track of which names are used so that there are no duplicates
var _ = require("lodash");

var users = function() {
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
        return _.mapValues(groups,
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
}

module.exports = users();
