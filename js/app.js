(function () {
'use strict';
var console = window.console;
var firebase = null; // = window.firebase; -- replaced when firebase app is loaded
var Fingerprint2 = null; // = window.Fingerprint2; -- replaced when Fingerprint2 is async loaded
var DEBUG = window.DEBUG;
var LOCAL_PLAYER_DEFAULT_ID = 'LOCAL_PLAYER_DEFAULT_ID';

var methods = window.methods = window.methods || {};
var uxState = window.uxState = window.uxState || {}; 

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


var networkUX = (function () {

    var setLocalPlayer = function (playerName) {
        uxState.localPlayerName = playerName;
        uxState.localPlayerId = playerName + uxState.localPlayerHashId;
        var gameContainerControls = document.getElementById('game-container-footer-A');
        var playerEl = gameContainerControls.querySelector('.player-id');
        playerEl.innerHTML = '<span class="label">Player:</span>' + 
                    '<span class="data">' + playerName + '</span>';
    };
    
    var setGameId = function (gameId) {
        uxState.currentGameId = gameId;
        
        if (!uxState.gameState || (uxState.gameState && uxState.gameState.gameId !== gameId)) {
            uxState.gameState = {
                gameId: gameId,
                playerState: {
                    
                }
            }
        }
        
    };
    
    var setNetworkFooterUX = function () {
        var gameId = uxState.gameState.gameId;

        var gameContainerControls = document.getElementById('game-container-footer-A');
        var gameIdEl = gameContainerControls.querySelector('.game-id');
        gameIdEl.innerHTML = '<span class="label">game:</span>' +
            '<span class="data">' + gameId + '</span>';

        var playerEl = gameContainerControls.querySelector('.player-id');
        playerEl.innerHTML = '<span class="label">Player:</span>' + 
            '<span class="data">' + uxState.localPlayerName + '</span>';
    };
    
    methods.uponJoinApprovalUX = function () {
        var gameId = uxState.gameState.gameId;
        console.log('-------- uponJoinApprovalUX()  ' + gameId + '  --------------');

        if (gameId) {
            methods.showActiveGameUX();
            setNetworkFooterUX();
            setNetworkUX('on');

        } else {
            setNetworkUX('off');
        }

    };

    var setNetworkUX = function(status) {
        var gameContainer = document.getElementById('game-container-A');

        if (status === 'on') {
            document.body.classList.add('network-game-active');
        } else {
            document.body.classList.remove('network-game-active');
            document.body.classList.remove('network-game-open');
            gameContainer.classList.remove('active');
        }
    }

    var expandNetworkUX = function() {
        document.body.classList.add('network-game-open');
    };
    
    var collapseNetworkUX = function() {
        document.body.classList.remove('network-game-open');
    };
    
    var featuredBoardEnter = function () {
        setTimeout(function () {
            var modal = document.getElementById('featured-board-A');
            var featuredBoard = modal.querySelector('.board-wrap');
            
            modal.classList.add('opaque');
            modal.classList.add('translate-shifting');
            featuredBoard.style.transform = 'scale(1, 1) translate(0, 0)'; 
            console.log('featureBoard!', featuredBoard);
            
            setTimeout(function () {
                var modal2 = document.getElementById('featured-board-A');
                modal2.classList.add('translate-arrived');
                modal2.classList.remove('translate-shifting');
            }, 400)
        }, 10);
    };
    
    methods.destroyFeaturedBoard = function() {
        var playerId;
        var target = document.getElementById('featured-board-target');
            
        // REMOVE ALL EVENT LISTENERS
        target.querySelectorAll('.game-square').forEach(function(el) {
            el.removeEventListener('click', methods.gameSquareListener);
        });
        
        // REMOVE BOARD FROM THE DOM
        target.innerHTML = '';

        // REMOVE BOARD REFERENCE FROM THE PLAYER
        // eslint-disable-next-line no-restricted-syntax
        for (playerId in uxState.players.byId) {
            if (uxState.players.hasOwnProperty(playerId)) {
                delete uxState.players.byId[playerId].featuredBoardId;
            }
        }

    };
    
    methods.featureGalleryBoard = (function (){
        
        var getBoardEl = function (el) {
            if (el.classList && el.classList.contains('board-wrap')) {
                return el;
            }
            if (!el.parentNode) {
                return null;
            }
            return getBoardEl(el.parentNode);
        };
        
        var getStartTransform = function (galleryEl, featureEl) {
            
            var gRect = galleryEl.getBoundingClientRect();
            var fRect = featureEl.getBoundingClientRect();
            
            const offsetTop = featureEl.offsetTop;
            const offsetLeft = featureEl.offsetLeft;
            
            var scale = gRect.width / fRect.width * 1.1;
            
            var yOffset = gRect.top - fRect.top - offsetTop;
            var xOffset = gRect.left - fRect.left - offsetLeft;
            
            var transformString = 'scale(' + scale.toFixed(3) + ', ' + scale.toFixed(3)  + ') ' + 
                'translate(' + (xOffset/scale).toFixed(3) + 'px, ' + (yOffset * 1.3 /scale).toFixed(3) + 'px)'; 

            console.group('getScale');
            console.log('galleryRect', gRect); 
            console.log('fRect', fRect);
            console.log('yOffset', yOffset); 
            console.log('xOffset', xOffset);
            console.log(' SCALE', scale);
            console.log('transform', transformString);
            console.groupEnd();
            
            return transformString; 
        };
        
        return function(playerId, boardId) {
            return function (event) {
                var player = uxState.players.byId[playerId];
                
                var galleryBoard = getBoardEl(event.target);

                // BUILD A NEW BOARD USING JUST [playerNo] AS THE BOARD ID
                const featuredBoardId = 'featured-board-' + player.localNumber;
                var featuredBoard = methods.buildGameBoard('featured-board-' + player.localNumber, 'featured');
                featuredBoard.setAttribute('id', featuredBoardId);
                player.featuredBoardId = featuredBoardId;

                // PUT A NAME IN THE DISPLAY MODAL
                document.getElementById('featured-player-target').innerHTML = player.name;
    
                // PUT THE BOARD IN THE DOM
                var target  = document.getElementById('featured-board-target');
                target.appendChild(featuredBoard);
                
                // var childNo = getChildNumber(target);
                // .appendChild(featuredBoard);
    
                // SHOW THE BIG MODAL
                var modal = document.getElementById('featured-board-A');
                modal.classList.add('show');
                featuredBoard.style.transform = getStartTransform(galleryBoard, featuredBoard); 
                
                // SET BOARD TYPE A OR B
                var boardType = uxState.gameState && uxState.gameState.boardType;
                if (boardType === 'B') {
                    methods.setupBoardB(featuredBoard, 'featured-board-' + player.localNumber);
                } else {
                    methods.setupBoardA(featuredBoard, 'featured-board-' + player.localNumber);
                }
    
                populateBoard(featuredBoardId, playerId);
                
                featuredBoardEnter();
            };
        };
    })(); 
    
    methods.collapseFeaturedModal = function () {
        var modal = document.getElementById('featured-board-A');
        modal.classList.remove('show');
        methods.destroyFeaturedBoard();
    };
    
    var populateBoard = (function (){
        var terrains = ['field', 'forest', 'monster', 'river', 'town'];
        var rowIndex = {
            '1': 'a',
            '2': 'b',
            '3': 'c',
            '4': 'd',
            '5': 'e',
            '6': 'f',
            '7': 'g',
            '8': 'h',
            '9': 'i',
            '10': 'j',
            '11': 'k'
        }
        
        var removeAllTerrains = function(square) {
            terrains.forEach(function(terrain) {
                square.classList.remove(terrain);
            })
        };
        
        return function (boardId, playerId) {
            var data = uxState.gameState.playerState[playerId];
            
                console.groupCollapsed('populateBoard(' + boardId + ', ' + playerId + ')');
                console.log('data', data);
                console.log('');
                console.log('');
            
            
            console.log('player', playerId, 'data', data);
            terrains.forEach(function(terrain) {
                if (data[terrain]) {
                    console.log('data[' + terrain + ']', data[terrain]);
                    data[terrain].forEach(function (plot) {
                        var id = 'row_' + rowIndex[plot[1]] + '_cell_' + plot[0] + '_' + boardId;
                        var square = document.getElementById(id);
                        if (square) {
                            removeAllTerrains(square);
                            square.classList.add(terrain);
                        } else {
                            console.log('---- square not found --- ', id);
                        }
                    });
                }
            });
            console.groupEnd();


        };
        
    })();

    methods.updateAllBoards = function (player) {
        if (player.galleryBoardId) {
            populateBoard(player.galleryBoardId, player.id);
        }
        if (player.featuredBoardId) {
            populateBoard(player.featuredBoardId, player.id);
        }
        if (player.mainBoardId) {
            populateBoard(player.mainBoardId, player.id);
        }
    };    
    
    methods.composeDataToUX = function (sourceData) {
        var playerState = {
            field: [],
            forest: [],
            monster: [],                
            river: [],
            town: [],
            score: 0
        };
        if (!sourceData) {
            return playerState;
        }
        var data = Array.isArray(sourceData) ? sourceData : JSON.parse(sourceData);
        
        playerState.field = data[0] || [];
        playerState.forest = data[1] || [];
        playerState.monster = data[2] || [];
        playerState.river = data[3] || [];
        playerState.town = data[4] || [];
        playerState.score = data[5] || 0;
        
        return playerState;
    };
    
    methods.composeUXToData = function (ux) {
        var data = [];
        data.push(ux.field || []);
        data.push(ux.forest || []);
        data.push(ux.monster || []);
        data.push(ux.river || []);
        data.push(ux.town || []);
        data.push(ux.score || 0);
        return JSON.stringify(data);
    }
    
    methods.collectDataFromDOM = (function () {
        function toArray(obj) {
            var array = [];
            // iterate backwards ensuring that length is an UInt32
            for (var i = obj.length >>> 0; i--;) { 
                array[i] = obj[i];
            }
            return array;
        }
        var playTerrains = [ 'forest', 'town', 'river', 'field', 'monster' ];

        var letterToNumber = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11, l: 12 }
        
        var getCoordinates = function (idString) {
            var coord = idString.split('_');
            return [Number(coord[3]), letterToNumber[coord[1]]];
        };

        return function (gameBoard) {
            var gameData = {
                field: [],
                forest: [],
                monster: [],
                river: [],
                town: [],
            };

            var playerId = gameBoard.getAttribute('data-player-id') || uxState.localPlayerId || LOCAL_PLAYER_DEFAULT_ID;
            gameBoard.querySelectorAll('.game-square').forEach(function(el) {
                playTerrains.forEach(function (terrain) {
                    if (toArray(el.classList).indexOf(terrain) !== -1) {
                        gameData[terrain].push(getCoordinates(el.id));
                    }
                });
            });
            
            uxState.gameState.playerState[playerId] = gameData;
            methods.network.sendPlayerUpdate(playerId);
            
        };
    })();
    
    methods.updateOpponentDataToUX = function (player) {
        uxState.gameState.playerState[player.id] = methods.composeDataToUX(player.data);
    };
    
    methods.removePlayer = function (playerId) {
        console.log('     V');
        console.log('     V');
        console.log('     |');
        console.log('     |');
        console.log('----- PLACE HOLDER ----- removePlayer(' + playerId + ') --------------');
        console.log('     |');
        console.log('     |');
        console.log('     ^');
        console.log('     ^');
    };

    methods.addPlayer = (function () {
        
        var createOpponentBoard = function (player) {
            var galleryId = 'gallery__' + player.localNumber;
            
            var board = methods.buildGameBoard(galleryId, 'opponent ' + player.id);
            var boardId = 'gallery-board-player_' + player.localNumber;
    
            board.setAttribute('id', boardId);
            board.setAttribute('data-player-id', player.id);
            
            var opponent = document.createElement('div');
            opponent.className = 'opponent-board-wrapper ' + player.localNumber;
            
            var title = document.createElement('div');
            title.className = 'opponent-title';
            title.innerHTML = '<div class="opponent-id">' + player.name + '</div>';
    
            opponent.appendChild(title);
            opponent.appendChild(board);
            
            board.addEventListener('click', methods.featureGalleryBoard(player.id, boardId))
            
            console.log('board', opponent); 
            
            var opponents = document.getElementById('game-frame-A');
            opponents.appendChild(opponent);
    
            var boardType = uxState.gameState && uxState.gameState.boardType;
            
            if (boardType === 'B') {
                methods.setupBoardB(board, galleryId);
            } else {
                methods.setupBoardA(board, galleryId);
            }
            
            return galleryId;
        };

        return function (player) {
            // ATTACH LOCAL NUMBER
            uxState.lastOpponentNumber++;
            player.localNumber = uxState.lastOpponentNumber;
            player.galleryBoardId = createOpponentBoard(player);
    
            // INDEX PLAYER 3 Ways 
            uxState.players.byNumber[player.localNumber] = player;
            uxState.players.byId[player.id] = player;
            uxState.players.byName[player.name] = player;
            
            methods.updateOpponentDataToUX(player);
    
            if (uxState.gameState && uxState.gameState.playerState && uxState.gameState.playerState[player.id]) {
                populateBoard(player.galleryBoardId, player.id)
            } else {
                console.group('PLAYER NOT FOUND');
                console.error('PLAYER ADD ERROR');
                console.log('player', player);
                console.log('uxState', uxState);
                console.groupEnd();
            }
        };
    })(); 
    
    var testAddPlayer = (function(){

        var testPlayersList = [
            { 
                id: 'CourtneyxxxxxA', name: 'Courtney',
                data: [
                    [ [9, 11], [10, 11], [11, 11] ],  // field
                    [ [10, 5], [10, 6], [10, 7], [11, 7] ],  // forest
                    [],  // monster
                    [ [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [9, 8] ],  // river
                    [ [2, 6], [3, 6], [3, 7], [3, 8] ],  // town
                    34 // score
                ]
            },
            { 
                id: 'RyanxxxxxB', name: 'Ryan',
                data: [
                    [ [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [9, 8] ],  // field
                    [ [2, 6], [3, 6], [3, 7], [3, 8] ],  // forest
                    [],  // monster
                    [ [10, 5], [10, 6], [10, 7], [11, 7] ],  // river
                    [ [9, 11], [10, 11], [11, 11] ],  // town
                    25  // score
                ]
            },
            { id: 'j10xxxxxC', name: 'j10'},
            { id: 'j11xxxxxD', name: 'j11'},
            { id: 'NickxxxxxE', name: 'Nick'},
            { id: 'SooeyxxxxxF', name: 'Sooey'},
            { id: 'DerekxxxxxG', name: 'Derek'},
            { id: 'LoraexxxxxH', name: 'Lorae'},
            { id: 'NatexxxxxI', name: 'Nate'},
            { id: 'SarahxxxxxJ', name: 'Sarah'},
            { id: 'MattxxxxxK', name: 'Matt'},
        ];

        return function () {
            var player = testPlayersList.shift();
            methods.addPlayer(player);
        }
    })();
        
    var runTests = function () {
        setLocalPlayer('Rebus Wampum III');
        setGameId('Kaboom Cha Cha');
        expandNetworkUX();
        testAddPlayer();
        testAddPlayer();
    };
    
    var facade = {
        testAddPlayer,
        runTests,
        openPanel: expandNetworkUX,
        closePanel: collapseNetworkUX
    };
    
    return facade;
})();

var networkInit = function () {

    methods.network = {};
    
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
    
    methods.DB = {
        gameDB: null,
        participantsDB: null,
        joinersDB: null,
        playersDB: {}
    };
    
    var reconcileSelfWithDataUpdate = function (player) {
        console.log('RECONCILE SELF -- GOT DATA FROM API!', player);
    };

    methods.network.sendPlayerUpdate = function (playerId) {
        if (methods.DB.playersDB[playerId]) {
            var data = methods.composeUXToData(uxState.gameState.playerState[playerId]);
            console.log('data to send for ' + playerId, data);
            if (data) {
                methods.DB.playersDB[playerId].update({data: data});
            }
        }
    };
    
    methods.network.exitGame = function () {
        console.error('methods.network.exitGame() called -- SOMETHING SHOULD HAPPEN!');
    };
    
    methods.network.cancelPendingJoin = function () {
        console.error('methods.network.cancelPendingJoin() called -- SOMETHING SHOULD HAPPEN!');
    };

    var onPlayerData = function(sourcePlayerId) {  // handle result of DB. snapshot results
        return function (playerSnapshot) {
            var player = playerSnapshot.val();
            console.log('track Player!', sourcePlayerId,  player);
    
            if (!player) {
                console.error('NO PLAYER IN TRACK!', this);
                return;
            }
    
            if (player.id === uxState.localPlayerId) {
                return reconcileSelfWithDataUpdate(player);
            }
            
            if (!uxState.players.byId[player.id]) {
                // NEW PLAYER ADDED TO SYSTEM!
                methods.addPlayer(player);
            } else {
                methods.updateOpponentDataToUX(player);
    
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
    
                methods.updateAllBoards(player);
            }
        }; 
    };

    var addPlayerTracker = function (playerId) {
        if (!methods.DB.playersDB[playerId]) {
            console.log('addPlayerTracker players/' + playerId);
            methods.DB.playersDB[playerId] = FB.ref('players/' + playerId);
            methods.DB.playersDB[playerId].on('value', onPlayerData(playerId));
        }
    };
    
    var removePlayerTracker = function (playerId) {
        if (methods.DB.playersDB[playerId]) {
            methods.DB.playersDB[playerId].off('value');
            delete methods.DB.playersDB[playerId];
        }
    };
    
    methods.network.approveJoiner = function (playerName) {
        methods.DB.joinersDB.once('value', function (joinerSnapshot) {
            var joiners = joinerSnapshot.val();

            console.log('approveJoiners', joiners);
            var playerId = joiners[playerName];
            
            console.log('approveJoiners playerId', playerId);

            if (playerId) {
                // methods.addPlayer(playerId);

                console.log('OG joiners', JSON.parse(JSON.stringify(joiners)));
                delete joiners[playerName];
                console.log('NEW joiners', JSON.parse(JSON.stringify(joiners)));
                
                methods.DB.joinersDB.set(joiners);

                var participantsUpdate = {};
                participantsUpdate[playerName] = playerId;
                methods.DB.participantsDB.update(participantsUpdate);
                
            }
        });
    };
    
    methods.network.checkGameId = function (gameId) {
        return new Promise(function(resolve, reject) {
            var gameData = FB.ref('games/' + gameId);
            gameData.once('value').then(function (snapshot) {
                resolve(snapshot.val());
            });
        });
    }
    
    methods.network.initializeSelf = function () {
        var allPlayersUpdate = {};
        var selfId = uxState.localPlayerId;
        var selfName = uxState.localPlayerName;

        addPlayerTracker(selfId)
        
        var update = {
            id: selfId,
            name: selfName,
            data: ''
        };

        allPlayersUpdate[uxState.localPlayerId] = update;

        if (DEBUG) { console.log('SELF -- initializeSelf', selfId, update); }
        FB.ref('players').update(allPlayersUpdate);

        // ADD TO LOCAL
        update.mainBoardId = 'self-main-board';
        uxState.players.byId[selfId] = update;
        uxState.players.byNumber[0] = update;
        uxState.players.byName[selfName] = update;
    };
    
    methods.network.trackJoiners = function () {
        methods.DB.joinersDB.off('value');
        methods.DB.joinersDB.on('value', function(childSnapshot) {
            console.group('joinersDB update');
            console.log('joinersDB snapshot', childSnapshot.val());
            console.log('TODO -- HOOOK UP THE TOASTER FOR APPROVAL OF JOINERS');
            // TODO -- HOOOK UP THE TOASTER FOR APPROVAL OF JOINERS
            console.groupEnd();
        });
    };
    
    var reconcileParticipants = function (currentParticipants) {
        var playerName, trackedPlayerId;
        var currentPlayerIds = {};
        
        // ADD UNTRACKED PLAYERS
        // eslint-disable-next-line no-restricted-syntax
        for (playerName in currentParticipants) {
            if (currentParticipants.hasOwnProperty(playerName)) {
                currentPlayerIds[currentParticipants[playerName]] = true;
                if (playerName !== uxState.localPlayerName) { 
                    // we set up the "self" player with a special case
                    addPlayerTracker(currentParticipants[playerName]);
                }
            }
        }

        if (DEBUG) { 
            console.log('reconcile currentParticipants', currentParticipants);
            console.log('reconscile currentPlayerIds', currentPlayerIds);
            console.log('reconcile methods.DB.playersDB', methods.DB.playersDB);
        }
        
        // REMOVE PLAYERS WHO HAVE LEFT THE GAME
        // eslint-disable-next-line no-restricted-syntax
        for (trackedPlayerId in methods.DB.playersDB) {
            if (methods.DB.playersDB.hasOwnProperty(trackedPlayerId)) {
                if (!currentPlayerIds[trackedPlayerId]) {
                    removePlayerTracker(trackedPlayerId);
                    methods.removePlayer(trackedPlayerId);
                }
            }
        }
    };
    
    methods.network.trackGameParticipants = function () {
        methods.DB.participantsDB.off('value');
        methods.DB.participantsDB.on('value', function (playersSnapshot) {
            var currentPlayers = playersSnapshot.val();
            reconcileParticipants(currentPlayers);
        })
    };

    methods.network.uponJoinApproval = function (currentParticipants) {
        var gameId = uxState.pendingGame;
        uxState.gameState.gameId = gameId;
        uxState.gameState.playerState = {};
        reconcileParticipants(currentParticipants);
        methods.network.trackGameParticipants();
        methods.network.initializeSelf();
        methods.network.trackJoiners();
    }
    
    var reconcileBoardType = function (initialGameData) {
        var boardType = uxState.gameState.boardType = initialGameData.boardType || 'A';
        if (uxState.currentPlayBoard !== boardType) {
            uxState.currentPlayBoard = boardType;
            if (boardType === 'A') {
                methods.setupBoardA();
            } else {
                methods.setupBoardB();
            }
        }
    };

    methods.network.requestGameJoin = function (initialGameData) {

        reconcileBoardType(initialGameData);

        methods.DB.gameDB = FB.ref('games/' +  initialGameData.id);
        methods.DB.participantsDB = FB.ref('games/' + initialGameData.id +'/participants');
        methods.DB.joinersDB = FB.ref('games/' + initialGameData.id + '/joiners');
        
        methods.DB.participantsDB.on('value', function(snapshot) {
            var participants = snapshot.val();
            if (participants[uxState.localPlayerName]) {
                // player has been added to the game
                methods.network.uponJoinApproval(participants);
                methods.uponJoinApprovalUX();
            }
         });
        
        var joinUpdate = {};
        joinUpdate[uxState.localPlayerName] = uxState.localPlayerId;
        methods.DB.joinersDB.update(joinUpdate);
    };
    
    methods.network.createNewGame = function () {

        var gameUpdate = {
            id: uxState.newGameId,
            players: {},
            joiners: {}
        };
        
        gameUpdate.players[uxState.localPlayerName] = uxState.localPlayerId;

        var playerUpdate = {
            id: uxState.localPlayerId,
            name: uxState.localPlayerName,
            data: methods.composeUXToData(uxState.gameState.playerState[uxState.localPlayerId])
        };
        
        methods.DB.playersDB[uxState.localPlayerId] = FB.ref('players/' + uxState.localPlayerId);
        methods.DB.playersDB[uxState.localPlayerId].set(playerUpdate);
        methods.DB.playersDB[uxState.localPlayerId].on(function(snapshot){
            console.log('localPlayer update!', snapshot);
            console.log('localPlayer update data!', snapshot.val());
        });
        
        method.DB.gameDB = FB.ref('games/' + uxState.newGameId)
        method.DB.gameDB.set(gameUpdate);
        method.DB.gameDB.on(function(snapshot) {
            console.log('game update!', snapshot.val());
        });
    };
    
    methods.network.testAcceptJoin = function () {
        var testGame = FB.ref('games/ggame');
        testGame.once('value', function (snapshot) {
            console.log('testGame', snapshot.val());
        })
    };
};

var initNetworkDOM = function () {
    var collapseButton = document.getElementById('collapse-button-A');
    var expandButton = document.getElementById('expand-button-A');
    expandButton.addEventListener('click', networkUX.openPanel);
    collapseButton.addEventListener('click', networkUX.closePanel);
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
                // methods.network.testAcceptJoin();
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
    methods.buildMainDom();
    methods.localInit();
    methods.setupBoardA();
    initNetworkDOM();

    loadScripts();
    
};
    
window.addEventListener('DOMContentLoaded', mainInit);

})();
