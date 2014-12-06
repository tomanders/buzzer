var _ = require("lodash");

var buzzList =  function (){
    //state
    var buzzlist = [];

    var registerPress = function(name){
        var userExists = _.contains(buzzlist, name);
        if (name && !userExists) {
            buzzlist.push(name);
            if (buzzlist.length == 1){
                return {status : true, first : true};
            }
            return {status : true, first : false}
        }
        //player already buzzed
        return {status : false, first : false};

    }
    
    var get = function (){
        return buzzlist;
    }
    
    var clearRound = function(){
        buzzlist = [];
    }
    
    return {
        registerPress : registerPress,
        get : get,
        clearRound : clearRound
    };
};

module.exports = buzzList();
