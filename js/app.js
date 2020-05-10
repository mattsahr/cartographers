(function () {
'use strict';

var firebase = null; // = window.firebase; -- replaced when firebase app is loaded
var console = window.console;
var Fingerprint2 = null; // = window.Fingerprint2; -- replaced when Fingerprint2 is async loaded

var methods = window.methods = window.methods || {};
var uxState = window.uxState = window.uxState || {}; 
var constants = window.constants = window.constants || {}; 

constants.playTerrains = [ 'forest', 'town', 'river', 'field', 'monster' ];

uxState.currentTerrain = 'forest';
uxState.currentPlayBoard = 'A';
uxState.gameBoardStarted = false;
uxState.showAboutPanel = false;

uxState.players = { byNumber: {}, byId: {} }
uxState.lastOpponentNumber = 0;

uxState.gameState = {
    // -- TODO -- REMOVE THIS TESTING DATA ---------------
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
        var gameContainerControls = document.getElementById('game-container-controls-A');
        var playerEl = gameContainerControls.querySelector('.player-id');
        playerEl.innerHTML = '<span class="label">Player:</span>' + 
                    '<span class="data">' + playerName + '</span>';
    };
    
    var setGameId = function (gameId) {
        uxState.currentGameId = gameId;
        
        if (!uxState.gameState || (uxState.gameState && uxState.gameState.gameId !== gameId)) {
            uxState.gameState = {
                gameId: gameId,
                players: {
                    
                }
            }
        }
        
        // ---- GAME CONTROLS SUB-HEADER ----------
        var gameContainerControls = document.getElementById('game-container-controls-A');
        var gameIdEl = gameContainerControls.querySelector('.game-id');
        gameIdEl.innerHTML = '<span class="label">game:</span>' +
                    '<span class="data">' + gameId + '</span>';
        
        // ---- ACION BUTTON ------------------
        var statusButton = document.getElementById('overview-button');
        
        if (gameId) {
            setNetworkUX('on');

            statusButton.classList.remove('join');
            statusButton.classList.add('active');

            statusButton.innerHTML = 
                '<span class="data">' + gameId + '</span>' +
                '<div class="change-settings-button"></div>';
        } else {
            setNetworkUX('off');
        }
    };
    
    methods.uponJoinApprovalUX = function () {
        console.log('     V');
        console.log('     V');
        console.log('     |');
        console.log('     |');
        console.log('----- PLACE HOLDER ----- uponJoinApprovalUX() --------------');
        console.log('grab all the players and make boards, dawg');
        console.log('     |');
        console.log('     |');
        console.log('     ^');
        console.log('     ^');
        setNetworkUX('on');
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
                var playerNo = uxState.players.byId[playerId].localNumber;
                var playerName = uxState.players.byId[playerId].name;
                
                var galleryBoard = getBoardEl(event.target);

                // BUILD A NEW BOARD USING JUST [playerNo] AS THE BOARD ID
                var featuredBoard = methods.buildGameBoard(playerNo, 'featured');
                featuredBoard.setAttribute('id', 'featured-board-' + playerNo);

                // PUT A NAME IN THE DISPLAY MODAL
                document.getElementById('featured-player-target').innerHTML = playerName;
    
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
                    methods.setupBoardB(featuredBoard, playerNo);
                } else {
                    methods.setupBoardA(featuredBoard, playerNo);
                }
    
                // ADD DATA TO THE BOARD
                var data = uxState.gameState.players[playerId];
                populateBoard(playerNo, data);
                
                featuredBoardEnter();
            };
        };
    })(); 
    
    methods.collapseFeaturedModal = function () {
        var modal = document.getElementById('featured-board-A');
        modal.classList.remove('show');
        // TODO -- REMOVE BOARD, REMOVE EVENT LISTENERS FROM IT
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
        
        return function (boardId, data) {
            terrains.forEach(function(terrain) {
                if (data[terrain]) {
                    data[terrain].forEach(function (plot) {
                        var id = 'row_' + rowIndex[plot[1]] + '_cell_' + plot[0] + '_' + boardId;
                        var square = document.getElementById(id);
                        
                        removeAllTerrains(square);
                        square.classList.add(terrain);
                    });
                }
            });
        };
        
    })();
    
    methods.composeDataToUX = function (data) {
        var playerState = {
            field: [],
            forest: [],
            monster: [],                
            river: [],
            town: [],
            score: 0
        };
        if (!data) {
            return playerState;
        }
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
    
    methods.updateOpponentDataToUX = function (player) {
        uxState.gameState.players[player.id] = methods.composeDataToUX(player.data);
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
            
            console.log('children', opponents.childElementCount);
            console.log('children', opponents.children.length);
    
            console.log('opponents', opponents);
    
            var boardType = uxState.gameState && uxState.gameState.boardType;
            
            if (boardType === 'B') {
                methods.setupBoardB(board, galleryId);
            } else {
                methods.setupBoardA(board, galleryId);
            }
            
            return galleryId;
        };

        return function (player) {
            uxState.lastOpponentNumber++;
            player.localNumber = uxState.lastOpponentNumber;
    
            uxState.players.byNumber[player.localNumber] = player;
            uxState.players.byId[player.id] = player;
            
            methods.updateOpponentDataToUX(player);
            
            var galleryId = createOpponentBoard(player);
    
            if (uxState.gameState && uxState.gameState.players && uxState.gameState.players[player.id]) {
                populateBoard(galleryId, uxState.gameState.players[player.id])
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

    var gameDB = null;
    var gamePlayers = null;
    var joinQ = null;
    var localPlayerDB = null;
    
    var playerTracker = {};

    var trackPlayer = function (playerSnapshot) {
        var playerUpdate = playerSnapshot.val();
        console.log('track Player!', playerUpdate);
        // update uxState.gameState
        // if UPDATE is about myself... special case
        //     else: if uxState.gameState doesn't have this player yet
        //          methods.addPlayer(player) 
        //      else populate opponent gameboard
    }

    var addPlayerTracker = function (playerId) {
        if (!playerTracker[playerId]) {
            playerTracker[playerId] = FB.ref('players/' + playerId).on('value', trackPlayer);
        }
    };
    
    var removePlayerTracker = function (playerId) {
        if (playerTracker[playerId]) {
            playerTracker[playerId].off('value');
            delete playerTracker[playerId];
        }
    };
    
    methods.network.approveJoiner = function (playerName) {
        joinQ.once('value', function (joinerSnapshot) {
            var joiners = joinerSnapshot.val();

            var playerId = joiners[playerName];
            if (playerId) {
                methods.addPlayer(playerId);

                console.log('OG joiners', JSON.parse(JSON.stringify(joiners)));
                delete joiners[playerName];
                console.log('NEW joiners', JSON.parse(JSON.stringify(joiners)));
                
                joinQ.set(joiners);

                gamePlayers.once('value', function (playerSnapshot) {
                    var currentPlayers = playerSnapshot.val();
                    if (currentPlayers[playerName]) {
                        // already added, do nothing
                    } else {
                        currentPlayers[playerName] = playerId;
                        gamePlayers.update(currentPlayers);
                    }
                })
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
        var selfUpdate = {};
        var selfId = uxState.localPlayerId;
        var selfName = uxState.localPlayerName;

        selfUpdate[uxState.localPlayerId] = {
            id: selfId,
            name: selfName,
            data: ''
        };
        FB.ref('players').update(selfUpdate);

        FB.ref('players/' + selfId).once('value', function (selfSnapshot) {
            var selfData = selfSnapshot.val();
            if (selfData) {
                addPlayerTracker(selfId)
            } else {
                setTimeout(methods.network.initiateSelfPlayer, 500);
            }
        });
    };
    
    methods.network.trackJoiners = function () {
        joinQ.off('value');
        joinQ.on('value', function(childSnapshot) {
            console.group('joinQ update');
            console.log('joinQ snapshot', childSnapshot.val());
            console.log('TODO -- HOOOK UP THE TOASTER FOR APPROVAL OF JOINERS');
            // TODO -- HOOOK UP THE TOASTER FOR APPROVAL OF JOINERS
            console.groupEnd();
        });
    };
    
    var checkPlayers = function (currentPlayers) {
        var playerName, trackedPlayerId;
        var currentPlayerIds = {};
        
        // ADD UNTRACKED PLAYERS
        // eslint-disable-next-line no-restricted-syntax
        for (playerName in currentPlayers) {
            if (currentPlayers.hasOwnProperty(playerName)) {
                if (playerName !== uxState.localPlayerName) { 
                    // we will set up the "self" player when it has been initialized
                    currentPlayerIds[currentPlayers[playerName]] = true;
                    addPlayerTracker(currentPlayers[playerName]);
                }
            }
        }

        // REMOVE PLAYERS WHO HAVE LEFT THE GAME
        // eslint-disable-next-line no-restricted-syntax
        for (trackedPlayerId in playerTracker) {
            if (playerTracker.hasOwnProperty(trackedPlayerId)) {
                if (!currentPlayerIds[trackedPlayerId]) {
                    removePlayerTracker(trackedPlayerId);
                    methods.removePlayer(trackedPlayerId);
                }
            }
        }
    };
    
    methods.network.trackGameParticipants = function () {
        gamePlayers.off('value');
        gamePlayers.on('value', function (playersSnapshot) {
            var currentPlayers = playersSnapshot.val();
            checkPlayers(currentPlayers);
        })
    };

    methods.network.uponJoinApproval = function (currentPlayers) {
        var gameId = uxState.pendingGame;
        uxState.gameState.gameId = gameId;
        uxState.gameState.players = {};
        checkPlayers(currentPlayers);
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

        gameDB = FB.ref('games/' +  initialGameData.id);
        
        gamePlayers = FB.ref('games/' + initialGameData.id +'/players');
        joinQ = FB.ref('games/' + initialGameData.id + '/joiners');
        
        gamePlayers.on('value', function(playersSnapshot) {
            var players = playersSnapshot.val();
            if (players[uxState.localPlayerName]) {
                // player has been added to the game
                methods.network.uponJoinApproval(players);
                methods.uponJoinApprovalUX();
                // turn off this listener;
                gamePlayers.off('value');
            }
         });
        
        joinQ.once('value', function (childSnapshot) {
            var joiners = childSnapshot.val();
            if (!joiners[uxState.localPlayerName]) {
                joiners[uxState.localPlayerName] = uxState.localPlayerId;
                joinQ.update(joiners);
            }
        })
        
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
            data: methods.composeUXToData(uxState.gameState.players[uxState.localPlayerId])
        };
        
        localPlayerDB = FB.ref('players/' + uxState.localPlayerId);
        localPlayerDB.set(playerUpdate);
        localPlayerDB.on(function(snapshot){
            console.log('localPlayer update!', snapshot.val());
        });
        
        gameDB = FB.ref('games/' + uxState.newGameId)
        gameDB.set(gameUpdate);
        gameDB.on(function(snapshot) {
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

var initializeNetwork = function () {

    
    /*
    var testStatusUpdater = function () {
        var statusButton = document.getElementById('overview-button');
        var gameContainer = document.getElementById('game-container-A');
        var gameContainerControls = document.getElementById('game-container-controls-A');
        var pageContainer = document.getElementById('page-container-A');

        if (statusButton.classList.contains('join')) {
            statusButton.classList.remove('join');
            statusButton.classList.add('active');

            statusButton.innerHTML = 
                '<span class="data">Awsum Sawce</span>' +
                '<div class="change-settings-button"></div>';

            // ==== NETWORK GAME PANEL ===============
            gameContainerControls.innerHTML = 
                '<div class="player-id">' +
                    '<span class="label">Player:</span>' + 
                    '<span class="data">Rufus Woo</span>' +
                '</div>' +
                '<div class="game-id">' +
                    '<span class="label">game:</span>' +
                    '<span class="data">Awsum Sawce</span>' +
                '</div>';

            document.body.classList.add('network-game-active');
            pageContainer.classList.add('top-shift-closed');
            pageContainer.classList.remove('top-shift-open');

        } else {
            statusButton.classList.add('join');
            statusButton.classList.remove('active');
            statusButton.innerHTML = 'JOIN';

            // ==== NETWORK GAME PANEL ===============
            document.body.classList.remove('network-game-active');
            pageContainer.classList.remove('top-shift-closed');
            pageContainer.classList.remove('top-shift-open');
            gameContainer.classList.remove('active');
        }
    };
    
  
    
    var testGameId = 'exampleA';

    var setGameId = function(name) {
        testGameId = name;
    };
    
    var localGameData = {};
    var gameDataMonitor = null;  
    
    var startMonitorOLD = function () {
        gameDataMonitor = database.ref('games/' + testGameId);
        
        gameDataMonitor.on('value', function(snapshot) {
            console.group('update');
            console.log('got gameData!', snapshot);

            var latest = snapshot.val();
            if (latest) { localGameData = latest; } 
            
            console.log('latest', latest);
            console.groupEnd();
        });
    };
    
    var setGameDataOLD = function (data, id) {
        var nextId = id || testGameId;

        console.log('sending to:', nextId, '  global gameId', testGameId);

        database.ref('games/' + nextId).set(
            data,
            function(error) {
                if (error) {
                    console.log('save error');
                } else {
                    console.log('save success! ' + nextId);
                }
            }
        );
    };
  
    var testD = document.getElementById('test-button-D');
    testD.addEventListener('click', network.testAddPlayer);
  */
  
}; // END initializeNetwork;

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

    console.log('loadscripts called');

    var loadFirebase = function () {
        
        var firebaseLoaded = function () {
            firebase = window.firebase;
            
            networkInit();
    
            setTimeout( function () {
                // networkUX.runTests();
                methods.network.testAcceptJoin();
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
        loadFile('../js/fingerprint2-min.js', success);
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
