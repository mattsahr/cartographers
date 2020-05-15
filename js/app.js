(function () {
'use strict';
var console = window.console;
var $ = window.$; // nano.js
var firebase = null; // = window.firebase; -- replaced when firebase app is loaded
var Fingerprint2 = null; // = window.Fingerprint2; -- replaced when Fingerprint2 is async loaded
var DEBUG = window.DEBUG;
var LOCAL_PLAYER_DEFAULT_ID = 'LOCAL_PLAYER_DEFAULT_ID';
var AUTO_JOIN_LOCAL_PLAYER = 'AUTO_JOIN_LOCAL_PLAYER';
var EMPTY_DATA_STRING = '[[],[],[],[],[],0]';

var methods = window.methods = window.methods || {};
var uxState = window.uxState = window.uxState || {};
var network = methods.network = methods.network || {}; 
var UX = methods.UX =  methods.UX || {};
var DB = methods.DB = methods.DB || {};

uxState.currentTerrain = 'forest';
uxState.currentPlayBoard = 'A';
uxState.gameBoardStarted = false;
uxState.showAboutPanel = false;

uxState.players = { byNumber: {}, byId: {}, byName: {} }
uxState.lastOpponentNumber = 0;

uxState.gameState = {
    playerState: {}
    /*
    boardType: 'A',
    gameId: 'wootang',
    players: {
        'Courtney': {
            river: [ [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [9, 8] ],
            town: [ [2, 6], [3, 6], [3, 7], [3, 8] ],
            field: [ [9, 11], [10, 11], [11, 11] ],
            forest: [ [10, 5], [10, 6], [10, 7], [11, 7] ],
            monster: []
        },
        'Ryan': {
            river: [ [10, 5], [10, 6], [10, 7], [11, 7] ],
            town: [ [9, 11], [10, 11], [11, 11] ],
            field: [ [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [9, 8] ],
            forest: [ [2, 6], [3, 6], [3, 7], [3, 8] ],
            monster: []
        }
    }
    */
};

var networkInit = function () {

    var firebaseConfig = {
        apiKey: 'AIzaSyB-gCq2q2enFZplF79T5Uwgub1YZMSBksM',
        authDomain: 'cartographers-734a5.firebaseapp.com',
        databaseURL: 'https://cartographers-734a5.firebaseio.com',
        projectId: 'cartographers-734a5',
        storageBucket: 'cartographers-734a5.appspot.com',
        messagingSenderId: '763941603897',
        appId: '1:763941603897:web:76020a2c1e93c80aacdbe8'
    };

    firebase.initializeApp(firebaseConfig);
    var FB = firebase.database();
    
    network.reconcileSelfWithDataUpdate = (function () {

        return function (playerFromDB) {
            console.log('RECONCILE SELF -- GOT DATA FROM API!', playerFromDB);
            if (network.doesBoardHaveData(playerFromDB.data)) {

                var player = uxState.players.byId[playerFromDB.id];

                console.log('PLAYER', player);
                console.log('FROM DB', playerFromDB);

                if (player) {
                    player.data = UX.composeDataToUX(playerFromDB.data);
                    uxState.gameState.playerState[player.id] = player.data;

                    UX.updateAllBoards(player);
                }
            }
        };
    })();


    network.composeUXToData = function (ux) {
        var data = [];
        data.push(ux.field || []);
        data.push(ux.forest || []);
        data.push(ux.monster || []);
        data.push(ux.river || []);
        data.push(ux.town || []);
        data.push(ux.score || 0);
        return JSON.stringify(data);
    };

    network.sendPlayerUpdate = function (playerId) {
        if (DB.playersDB[playerId]) {
            var data = network.composeUXToData(uxState.gameState.playerState[playerId]);
            console.log('data to send for ' + playerId, data);
            if (data) {
                DB.playersDB[playerId].update({data: data});
            }
        }
    };

    network.cleanOutOldGames = function () {
        // SOURCE https://stackoverflow.com/questions/32004582/delete-firebase-data-older-than-2-hours
        var ref = FB.ref('/games/');
        var now = Date.now();

        var cutoff = now - 6 * 60 * 60 * 1000;
        // SIX HOURS AGO

        var old = ref.orderByChild('timestamp').endAt(cutoff).limitToLast(1);

        var listener = old.on('child_added', function(snapshot) {
            console.log('TODO -- cleanOutOldGames', snapshot.val());
            console.log('TODO -- also build cleanOutOldPlayers()');
            // snapshot.ref.remove();
        });
    };

    network.deleteGameIfEmpty = (function () {

        var clearParticipantNoise = function (participants) {
            var i = participants.length;
            while (i > 0) {
                i--;

                if (participants[i] === 'dummyParticipant' || participants[i] === uxState.localPlayerName) {
                    participants.splice(i, 1);
                }
            }
            return participants;
        };

        return function (gameId) {
            console.log('TODO -- REMOVE [' + gameId + '] IF DUMMY JOINER, PARTICIPANT');

            FB.ref('games/' + gameId).once('value', function(snapshot) {
                var game = snapshot.val();

                console.log('is game empty?', game);
                if (game && game.participants) {
                    var realParticipants = clearParticipantNoise(Object.keys(game.participants));

                    if (realParticipants.length) {
                        return;
                    }
                }

                var gameToDelete = FB.ref('games/' + gameId);
                gameToDelete.remove();
            });

        };

    })();
    
    network.exitGame = function () {
        if (DEBUG) {
            console.group('exit pending or actual game');
            console.log('uxState', uxState);
            console.log('methods', methods);
            console.groupEnd();
        }

        // CLEAR ALL LOCAL STATE
        var localPlayerData = uxState.players.byNumber[0] || {
            id: uxState.lcoalPlayerId,
            name: uxState.lcoalPlayerName,
            data: null
        };


        var gameToExit = uxState.priorGame = 
            uxState.pendingGame || uxState.gameState.gameId;

        uxState.pendingGame = '';
        uxState.gameState.id = '';
        uxState.gameState.playerState = {};
        uxState.gameState.playerState[localPlayerData.id] = localPlayerData.data;

        // CLEAR OTHER PLAYERS, BUT KEEP LOCAL PLAYER
        uxState.players.byNumber = { '0': localPlayerData };
        uxState.players.byId = {};
        uxState.players.byName = {};
        uxState.players.byId[localPlayerData.id] = localPlayerData;
        uxState.players.byName[localPlayerData.name] = localPlayerData;

        // CLEAR ALL DB LISTENERS
        DB.clearAll();

        // SEND A LEAVE GAME REQUEST TO THE DB, EVEN IF IT'S REDUNDANT
        var cancelParticipant = FB.ref('games/' + gameToExit + '/participants/' + uxState.localPlayerName);
        cancelParticipant.remove();
            /* 
            .then(function(result) { 
                if (DEBUG) {
                    console.group('particpant removed');
                    console.log('games/' + gameToExit + '/participants/' + uxState.localPlayerName);
                    console.log('participant result', result);
                    console.log('val', (result && result.val ? result.val() : 'NADA'));
                    console.groupEnd();
                }
            })
            .catch(function(error) { console.log('participant remove failed!', error.message); });
            */
        var cancelJoiner = FB.ref('games/' + gameToExit + '/joiners/' + uxState.localPlayerName);
        cancelJoiner.remove();
            /*
            .then(function(result) { 
                if (DEBUG) {
                    console.group('joiner removed');
                    console.log('games/' + gameToExit + '/joiners/' + uxState.localPlayerName);
                    console.log('join result', result);
                    console.log('val', (result && result.val ? result.val() : 'NADA'));
                    console.groupEnd();
                }
            })
            .catch(function(error) { console.log('joiner remove failed!', error.message); });
            */

        network.deleteGameIfEmpty(gameToExit);
    };

    network.cancelPendingJoin = function () {
        network.exitGame();
    };

    var onPlayerData = function(sourcePlayerId) {  // handle result of DB. snapshot results
        DB.playerListeners[sourcePlayerId] = function (playerSnapshot) {
            var player = playerSnapshot.val();
            console.log('track Player!', sourcePlayerId,  player);
    
            if (!player) {
                console.error('NO PLAYER IN TRACK!', this);
                return;
            }
    
            if (player.id === uxState.localPlayerId) {
                return network.reconcileSelfWithDataUpdate(player);
            }
            
            if (!uxState.players.byId[player.id]) {
                // NEW PLAYER ADDED TO SYSTEM!
                UX.addPlayer(player);
            } else {
                UX.updateOpponentDataToUX(player);
    
                // RE - ATTACH LOCAL RESOURCES
                player.localNumber = uxState.players.byId[player.id].localNumber;
                player.galleryBoardId = uxState.players.byId[player.id].galleryBoardId;
                player.featuredBoardId = uxState.players.byId[player.id].featuredBoardId;
                player.mainBoardId = uxState.players.byId[player.id].mainBoardId;
                
                if (!player.localNumber) {
                    console.error ('no local number!', player);
                    console.log('uxState.players', uxState.players);
                    
                    return;
                }
                
                if (!player.galleryBoardId) {
                    console.error ('no galleryBoardId!', player);
                    console.log('uxState.players', uxState.players);
                }
    
                // RE-INDEX PLAYER 
                uxState.players.byNumber[player.localNumber] = player;
                uxState.players.byId[player.id] = player;
                uxState.players.byName[player.name] = player;
    
                UX.updateAllBoards(player);
            }
        };

        return DB.playerListeners[sourcePlayerId]
    };

    network.addPlayerTracker = function (playerId) {
        if (!playerId) { return; }
        if (!DB.playersDB[playerId]) {
            console.log('network.addPlayerTracker players/' + playerId);
            DB.playersDB[playerId] = FB.ref('players/' + playerId);
            DB.playersDB[playerId].on('value', onPlayerData(playerId));
        }
    };

    network.removePlayerTracker = function (playerId) {
        if (DB.playersDB[playerId]) {
            DB.playersDB[playerId]
                .off(
                    'value',
                    DB.playerListeners[playerId]
                );

            delete DB.playersDB[playerId];
            delete DB.playerListeners[playerId];
        }
    };

    network.approveJoiner = function (playerName, option) {
        DB.joinersDB.once('value', function (joinerSnapshot) {
            var joiners = joinerSnapshot.val();

            console.log('approveJoiners', joiners);
            var playerId = option === AUTO_JOIN_LOCAL_PLAYER 
                ? uxState.localPlayerId
                : joiners[playerName];
            
            console.log('approveJoiners playerName', playerName, '  playerId', playerId);

            if (playerId) {

                console.log('OG joiners', JSON.parse(JSON.stringify(joiners)));
                delete joiners[playerName];
                console.log('NEW joiners', JSON.parse(JSON.stringify(joiners)));
                DB.joinersDB.set(joiners);

                var participantsUpdate = {};
                participantsUpdate[playerName] = playerId;

                console.log('ApproveJoiner, THE UPDATE', participantsUpdate);

                DB.participantsDB.update(participantsUpdate);
                
            }
        });
    };

    network.checkGameId = function (gameId) {
        return new window.Promise(function(resolve) {
            var gameData = FB.ref('games/' + gameId);
            gameData.once('value').then(function (snapshot) {
                resolve(snapshot.val());
            });
        });
    }

    network.doesBoardHaveData = function (dataOrString) {
        if (!dataOrString) {
            return false;
        }
        var i;
        var data = typeof dataOrString === 'string' ? JSON.parse(dataOrString) : dataOrString;
        for (i = 0; i < 4; i++) {
            if (data[i] && data[i].length) {
                return true;
            }
        }
        return false;
    }

    network.initializeSelf = function () {
        var selfId = uxState.localPlayerId;
        var selfName = uxState.localPlayerName;

        if (DEBUG) { console.log('SELF -- addPlayerTracker', selfId); }

        if (DEBUG) {
            console.group('SELF initialize');
            console.log('selfId', selfId);
            console.groupEnd();
        }

        FB.ref('players/' + selfId).once('value', function(snapshot) {

            var update = {
                id: selfId,
                name: selfName,
            };

            var allPlayersUpdate = {};
            allPlayersUpdate[uxState.localPlayerId] = update;

            var localBoardData = network.composeUXToData(
                UX.collectDataFromDOM('self-main-board', 'requestReturn')
            );

            if (network.doesBoardHaveData(localBoardData)) {
                update.data = localBoardData;
            } else {
                var playerFromDB = snapshot.val();
                if (playerFromDB && playerFromDB.data && network.doesBoardHaveData(playerFromDB.data)) {
                    update.data = playerFromDB.data;
                }
            }

            var allPlayers = FB.ref('players')
            allPlayers.update(allPlayersUpdate);

            network.addPlayerTracker(selfId);

            update.data = UX.composeDataToUX(update.data);
            UX.initializeSelf(selfId, update);

        });

    };

    network.trackJoiners = function () {
        DB.joinersDB.off('value', DB.joinerListener);
        DB.joinersDB.on('value', DB.joinerListener);
    };

    network.reconcileParticipants = function (currentParticipants) {
        var currentPlayerIds = {};
        
        // ADD UNTRACKED PLAYERS
        Object.keys(currentParticipants).forEach(function (participantName) {
            currentPlayerIds[currentParticipants[participantName]] = true;

            if (participantName !== uxState.localPlayerName && 
                participantName !== 'dummyParticipant'
            ) {
                console.log('>>>> ADD TRACKER >>>> ', currentParticipants[participantName]);
                network.addPlayerTracker(currentParticipants[participantName]);
            }
        });


        if (DEBUG) { 
            console.log('reconcile currentParticipants', currentParticipants);
            console.log('reconscile currentPlayerIds', currentPlayerIds);
            console.log('reconcile DB.playersDB', DB.playersDB);
        }

        var isNonParticipant = function (id) {
            return !currentPlayerIds[id];
        }

        
        // REMOVE PLAYERS WHO HAVE LEFT THE GAME
        Object.keys(DB.playersDB).forEach(function(tracked) {
            if (isNonParticipant(tracked)) {
                console.log('>>>> REMOVE TRACKER >>>> ', tracked);
                network.removePlayerTracker(tracked);
                UX.removeOpponentPlayer(tracked);

                if (tracked === uxState.localPlayerId) {
                    // LOCAL PLAYER HAS BEEN BOOTED, OR CHOSE TO EXIT
                    network.exitGame();
                    UX.exitGameUX();
                }
            }
        });

    };

    network.trackGameParticipants = function () {
        DB.participantsDB.off('value', DB.participantsListener);
        DB.participantsDB.off('value', DB.participantsListenToJoin);
        DB.participantsDB.on('value', DB.participantsListener);
    };

    network.uponJoinApproval = function (currentParticipants) {
        var gameId = uxState.pendingGame;
        uxState.gameState.gameId = gameId;
        uxState.gameState.playerState = {};

        network.reconcileParticipants(currentParticipants);
        network.trackGameParticipants();
        network.initializeSelf();
        network.trackJoiners();
        UX.showActiveGameUX();
    };
    

    network.requestGameJoin = function (gameData) {

        UX.reconcileBoardType(gameData);

        DB.clear(DB.gameDB);
        DB.clear(DB.participantsDB);
        DB.clear(DB.joinersDB);

        DB.gameDB = FB.ref('games/' +  gameData.id);
        DB.participantsDB = FB.ref('games/' + gameData.id +'/participants');
        DB.joinersDB = FB.ref('games/' + gameData.id + '/joiners');
        
        DB.participantsDB.on('value', DB.participantsListenToJoin);
        
        var joinUpdate = {};

        joinUpdate[uxState.localPlayerName] = uxState.localPlayerId;
        DB.joinersDB.update(joinUpdate);

    };
    
    network.resetMainBoard = function () {
        if (uxState.localPlayerId) {
            var update = {
                id: uxState.localPlayerId,
                name: uxState.localPlayerName,
                data: EMPTY_DATA_STRING
            };
            FB.ref('players/' + uxState.localPlayerId).set(update);
        }
    };

    network.createNewGame = function () {
        var gameId = uxState.gameState.gameId;
        var update = {};
        update[uxState.gameState.gameId] = {
            boardType: uxState.gameState.boardType,
            id: gameId,
            joiners: {
                dummyJoiner: 'dummyJoinerXXX'
            },
            participants: {
                dummyParticipant: 'dummyParticipantYYY'
            }
        }
        var tempGamesDB = FB.ref('games/');
        tempGamesDB.update(update);

        var tempGameDB = FB.ref('games/' + uxState.gameState.gameId);
        tempGameDB.once('value', function (snapshot) {
            var results = snapshot.val();
            console.log('onCREATE!', results);
            network.requestGameJoin(results);

            setTimeout(function () {
                console.log('approveJoiner');
                console.log('playerName', uxState.localPlayerName);
                console.log('uxState', uxState);
                network.approveJoiner(uxState.localPlayerName, AUTO_JOIN_LOCAL_PLAYER);
            }, 150);
        });   

        /*
        gameUpdate.players[uxState.localPlayerName] = uxState.localPlayerId;
        var playerUpdate = {
            id: uxState.localPlayerId,
            name: uxState.localPlayerName,
            // TODO -- GET THIS INFO FROM THE DOM
            data: UX.composeUXToData(uxState.gameState.playerState[uxState.localPlayerId])
        };

        DB.playersDB[uxState.localPlayerId] = FB.ref('players/' + uxState.localPlayerId);
            DB.playersDB[uxState.localPlayerId].set(playerUpdate);
            DB.playersDB[uxState.localPlayerId].on(function(snapshot){
                console.log('localPlayer update!', snapshot);
                console.log('localPlayer update data!', snapshot.val());
            });
        
            method.DB.gameDB = FB.ref('games/' + uxState.newGameId)
            method.DB.gameDB.set(gameUpdate);
            method.DB.gameDB.on(function(snapshot) {
                console.log('game update!', snapshot.val());
            });
        */

    };
    
    network.cleanOutOldGames();
};

var loadFile = function (fileName, callback) {

    var fileRequest = document.createElement('script');
    fileRequest.setAttribute('type', 'text/javascript');
    fileRequest.setAttribute('src', fileName);
    fileRequest.setAttribute('async', true);
    if (callback) {
        fileRequest.onload = callback;
    }

    document.getElementsByTagName('head')[0].appendChild(fileRequest);
};

var loadScripts = (function () {

    var loadFirebase = function () {
        
        var firebaseLoaded = function () {
            firebase = window.firebase;
            
            networkInit();
    
            setTimeout( function () {
                // networkUX.runTests();
                // network.testAcceptJoin();
            }, 500)
        };
        
        var phase02 = function () {
            loadFile('https://www.gstatic.com/firebasejs/7.14.2/firebase-database.js', firebaseLoaded);
        }
        
        loadFile('https://www.gstatic.com/firebasejs/7.14.2/firebase-app.js', phase02);
        
    };
    
    var getFingerprint = function () {
        Fingerprint2 = window.Fingerprint2;

        var options = {
             excludes: {
                userAgent: true, 
                language: true,
                webdriver: true,
                colorDepth: true,
                deviceMemory: true,
                pixelRatio: true,
                hardwareConcurrency: true,
                screenResolution: true,
                availableScreenResolution: true,
                timezoneOffset: true,
                timezone: true,
                sessionStorage: true,
                localStorage: true,
                indexedDb: true,
                addBehavior: true,
                openDatabase: true,
                cpuClass: true,
                platform: true,
                doNotTrack: true,
                webgl: true,
                webglVendorAndRenderer: true,
                adBlock: true,
                hasLiedLanguages: true,
                hasLiedResolution: true,
                hasLiedOs: true,
                hasLiedBrowser: true,
                touchSupport: true,
                fonts: true,
                fontsFlash: true,
                audio: true,
                enumerateDevices: true
             }
        };
    
        var fingerprintResults = function (components) {
            var canvas = null;
            var plugins = null;
    
            components.forEach(function(component) { 
                if (component.key === 'canvas') { canvas = JSON.stringify(component.value); }
                if (component.key === 'plugins') { plugins = JSON.stringify(component.value); }
            });
            var fingerprint = canvas + plugins;
            uxState.localPlayerHashId = Fingerprint2.x64hash128(fingerprint, 31)
    
            console.groupCollapsed('FINGERPRINT');
            console.log(uxState.localPlayerHashId, components);
            console.groupEnd();
        };
        
        
        setTimeout(function () {
            Fingerprint2.get(options, fingerprintResults)  
        }, 100)
    
    };
    
    var success = function () {
        getFingerprint();
        loadFirebase();
    };
    
    return function () {
        loadFile('js/fingerprint2-min.js', success);
    };
})();


var mainInit = function () {
    UX.buildMainDom();
    UX.localInit();
    UX.setupBoardA();
    UX.initializeOpponentUX()

    loadScripts();
    
};
    
window.addEventListener('DOMContentLoaded', mainInit);

})();
