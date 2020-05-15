(function () {

var console = window.console;
var methods = window.methods = window.methods || {};
var uxState = window.uxState = window.uxState || {};
var network = methods.network = methods.network || {}; 
var UX = methods.UX = methods.UX || {};
var DEBUG = window.DEBUG;
var DB = methods.DB = methods.DB || {};

DB.gameDB = null;
DB.participantsDB = null
DB.joinersDB = null;
DB.playersDB = {};

DB.participantsListener = function (playersSnapshot) {
    var currentPlayers = playersSnapshot.val();

	if (DEBUG) {
		console.log('LISTEN TO OTHER PARTICIPANTS', currentPlayers);
	}

    network.reconcileParticipants(currentPlayers);
};


DB.joinerListener = (function () {
    var priorJoiners = null;

    var noChange = { changeDetected: false };

    var clearJoinerNoise = function (joinersObject) {

        if (!joinersObject) {
            return noChange;
        }

        var i;
        var playerID;
        var playerName;
        var changeDetected = false;
        var delivery = {};
        var joiners = Object.keys(joinersObject);

        for (i = 0; i < joiners.length; i++) {

            playerName = joiners[i];
            playerID = joinersObject[playerName];

            if (
                !DB.playersDB[playerID] && 
                playerName !== 'dummyJoiner' && 
                playerName !== uxState.localPlayerName
            ) {
                delivery[playerName] = playerID;

                if (!priorJoiners[playerName]) {
                    changeDetected = true;
                }
            }
        }

        priorJoiners = delivery;

        return { joiners: delivery, changeDetected: changeDetected };

    };

    return function(childSnapshot) {
        var joinData = clearJoinerNoise(childSnapshot.val());
        console.log('DB JOIN LISTENER', joinData);

        if (joinData.changeDetected) {
            UX.updateJoinQ(joinData.joiners);
        }
    };
})();

DB.participantsListenToJoin = function(snapshot) { // listens to participantsDB
    var participants = snapshot.val();

    	if (DEBUG) {
    		console.log('LISTEN TO PARTICIPANTS JOIN', participants);
    	}

    if (participants[uxState.localPlayerName]) {
        // player has been added to the game
        network.uponJoinApproval(participants);
        UX.uponJoinApprovalUX();
    }
 };

DB.playerListeners = {};

DB.clear = function(db, listener) { 
    if (db) { 
        db.off('value', listener); 
    } 
};

DB.clearAll = function () {
    DB.clear(DB.gameDB);
    DB.clear(DB.participantsDB, DB.participantsListener);
    DB.clear(DB.participantsDB, DB.participantsListenToJoin);

    
    DB.clear(DB.joinersDB);
    var player;
    // eslint-disable-next-line no-restricted-syntax
    for (player in DB.playersDB) {
        if (DB.playersDB.hasOwnProperty(player)) {
            network.removePlayerTracker(player);
            // DB.clear(DB.playersDB[player]);
        }
    }
};



})();