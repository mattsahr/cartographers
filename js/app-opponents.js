(function () {

var console = window.console;
var methods = window.methods = window.methods || {};
var uxState = window.uxState = window.uxState || {};
var network = methods.network = methods.network || {}; 
var toastada = window.toastada;
var UX = methods.UX =  methods.UX || {};
var DEBUG = window.DEBUG;

var opponentListeners = {
	gallery: {},
	featured: {}
};

UX.exitGameNotifyUX = (function () {

    var options = {
        lifeSpan: 60 * 1000,
        position: 'center-center'
        // onDismiss: onToasterDismiss,
        // onClick: onToasterClick,
        // animate: true
    };

    return function () {

        console.log('UX.exitGameNotifyUX');

        var gameId = uxState.priorGame 
            ? ('"<span class="game-id">' + uxState.priorGame + '</span>" ') 
            : '';

        toastada.setOptions(options);
        toastada.error(
            '<div class="close-me">x</div>' + 
            '<div class="join-table">' + 
                '<div class="title">Game Exit</div>' +
            '</div>' +
            'You have left the '+ gameId + 'game.'
            );
    };
})(); 

UX.updateJoinQ = (function () {
	var onToasterDismiss = function (e) {
		console.log('goodbye toaster', e);
	};

	var onToasterClick =  function (e) {
		var joiner = e.target.getAttribute('data-joiner');
		e.target.classList.add('pending');
		network.approveJoiner(joiner);
		console.log('toaster click!', joiner, e);

        var outstandingJoiners = false;

        document.querySelectorAll('.toast-container .joiner')
            .forEach(function (joinerEl) {
                if (!joinerEl.classList.contains('pending')) {
                    outstandingJoiners = true;
                }
            });

        if (!outstandingJoiners) {
            toastada.closeAll();
        }
	};

	var composeJoinTable = function (joiners) {
		var delivery = '<div class="join-table"><div class="title">Join Game:</div>';

		joiners.forEach(function (joiner) {
			if (joiner !== 'dummyJoiner') {
				delivery += 
					'<div class="joiner" data-joiner="' + joiner + '">' +
						joiner +
						'<div class="check"></div>' +
					'</div>';
			}
		});
		delivery += '</div>';

		return '<div class="close-me">x</div>' + delivery;
	};

    // TODO -- THIS IS REDUNDANT IF THE DB JOIN LISTENER WORKS
	var clearJoinerNoise = function (joiners) {
		var i = joiners.length;
		while (i > 0) {
			i--;

			if (joiners[i] === 'dummyJoiner' || joiners[i] === uxState.localPlayerName) {
				joiners.splice(i, 1);
			}

		}
	};

    var options = {
        lifeSpan: 15 * 1000,
        onDismiss: onToasterDismiss,
        onClick: onToasterClick,
        animate: true,
        position: 'top-right'
    };


	var onChange = function (joinersObject) {
		if (!joinersObject) {
			return;
		}

		var joiners = Object.keys(joinersObject);

		clearJoinerNoise(joiners);

		toastada.closeAll();

		if (!joiners.length) {
			return;
		}

		var joinTable = composeJoinTable(joiners);

		console.log('joinTable!', joinTable);

		toastada.closeAll();
        toastada.setOptions(options);
		toastada.info(joinTable);

	};

	return onChange;
})();

UX.initializeOpponentUX = function () {

	UX.expandNetworkUX = function() {
        document.body.classList.add('network-game-open');
    };
    
    UX.collapseNetworkUX = function() {
        document.body.classList.remove('network-game-open');
    };
    
    var collapseButton = document.getElementById('collapse-button-A');
    var expandButton = document.getElementById('expand-button-A');
    expandButton.addEventListener('click', UX.expandNetworkUX);
    collapseButton.addEventListener('click', UX.collapseNetworkUX);
};

UX.updateOpponentDataToUX = function (player) {
	uxState.gameState.playerState[player.id] = UX.composeDataToUX(player.data);
	uxState.players.byId[player.id].data = uxState.gameState.playerState[player.id];
};

UX.removeOpponentPlayer = function (playerId) {
    console.log('-------- Opponent removePlayer(' + playerId + ') --------------');

    var galleryBoard = document.querySelector('.board-wrap.' + playerId);
    if (galleryBoard) {
        galleryBoard.removeEventListener('click', opponentListeners.gallery[playerId]);
        galleryBoard.remove();
    }
    document.querySelectorAll('.opponent-board-wrapper')
        .forEach(function (opponent) {
            var id = opponent.getAttribute('data-player-id');
            if (id === playerId) {
                opponent.remove();
            }
        });

    var feauredBoard = document.querySelector('.board-wrap.featured');
    if (feauredBoard) {
        var id = feauredBoard.getAttribute('data-player-id');
        if (id === playerId) {
            UX.collapseFeaturedModal();
        }
    }

};
    
UX.exitGameOpponentsUX = function () {
	UX.setNetworkUX('off');
};

UX.addPlayer = (function () {
    
    var createOpponentBoard = function (player) {
        // var galleryId = 'gallery__' + player.localNumber;
        var boardId = 'gallery-board-player_' + player.localNumber;
        
        var board = UX.buildGameBoard(boardId, 'opponent ' + player.id);

        board.setAttribute('id', boardId);
        board.setAttribute('data-player-id', player.id);
        
        var opponent = document.createElement('div');
        opponent.className = 'opponent-board-wrapper ' + player.localNumber;
        opponent.setAttribute('data-player-id', player.id);
        
        var title = document.createElement('div');
        title.className = 'opponent-title';
        title.innerHTML = '<div class="opponent-id">' + player.name + '</div>';

        opponent.appendChild(title);
        opponent.appendChild(board);
        
        opponentListeners.gallery[player.id] = UX.featureGalleryBoard(player.id, boardId);

        board.addEventListener('click', opponentListeners.gallery[player.id]);
        
        console.log('board', opponent); 
        
        var opponents = document.getElementById('game-frame-A');
        opponents.appendChild(opponent);

        var boardType = uxState.gameState && uxState.gameState.boardType;
        
        if (boardType === 'B') {
            UX.setupBoardB(board, boardId);
        } else {
            UX.setupBoardA(board, boardId);
        }
        
        return boardId;
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
        
        UX.updateOpponentDataToUX(player);

        if (uxState.gameState && uxState.gameState.playerState && uxState.gameState.playerState[player.id]) {
            UX.populateBoard(player.galleryBoardId, player.id)
        } else {
            console.group('PLAYER NOT FOUND');
            console.error('PLAYER ADD ERROR');
            console.log('player', player);
            console.log('uxState', uxState);
            console.groupEnd();
        }
    };
})(); 

UX.setNetworkFooterUX = function () {
    var gameId = uxState.gameState.gameId;

    var gameContainerControls = document.getElementById('game-container-footer-A');
    var gameIdEl = gameContainerControls.querySelector('.game-id');
    gameIdEl.innerHTML = '<span class="label">game:</span>' +
        '<span class="data">' + gameId + '</span>';

    var playerEl = gameContainerControls.querySelector('.player-id');
    playerEl.innerHTML = '<span class="label">Player:</span>' + 
        '<span class="data">' + uxState.localPlayerName + '</span>';
};

UX.setNetworkUX = function(status) {
    var gameContainer = document.getElementById('game-container-A');

    if (status === 'on') {
        document.body.classList.add('network-game-active');
    } else {
        document.body.classList.remove('network-game-active');
        document.body.classList.remove('network-game-open');
        gameContainer.classList.remove('active');
    }
}

UX.featureGalleryBoard = (function (){
    
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

        /*
        console.group('getScale');
        console.log('galleryRect', gRect); 
        console.log('fRect', fRect);
        console.log('yOffset', yOffset); 
        console.log('xOffset', xOffset);
        console.log(' SCALE', scale);
        console.log('transform', transformString);
        console.groupEnd();
        */

        return transformString; 
    };
    
    return function(playerId, boardId) {
        return function (event) {
            var player = uxState.players.byId[playerId];
            
            var galleryBoard = getBoardEl(event.target);

            // BUILD A NEW BOARD USING JUST [playerNo] AS THE BOARD ID
            const featuredBoardId = 'featured-board-' + player.localNumber;
            var featuredBoard = UX.buildGameBoard('featured-board-' + player.localNumber, 'featured');
            featuredBoard.setAttribute('id', featuredBoardId);
            // ATTACH THE PLAYER ID AS A DATA ATTRIBUTE
            featuredBoard.setAttribute('data-player-id', playerId);
            player.featuredBoardId = featuredBoardId;

            // PUT A NAME IN THE DISPLAY MODAL
            document.getElementById('featured-player-target').innerHTML = player.name;

            // PUT THE BOARD IN THE DOM
            var target  = document.getElementById('featured-board-target');
            target.appendChild(featuredBoard);
            
            // HOOK UP THE GAME SQUARES TO THE UX
            UX.initGameBoard(featuredBoardId);

            // SHOW THE BIG MODAL
            var modal = document.getElementById('featured-board-A');
            modal.classList.add('show');
            featuredBoard.style.transform = getStartTransform(galleryBoard, featuredBoard); 
            
            // SET BOARD TYPE A OR B
            var boardType = uxState.gameState && uxState.gameState.boardType;
            if (boardType === 'B') {
                UX.setupBoardB(featuredBoard, 'featured-board-' + player.localNumber);
            } else {
                UX.setupBoardA(featuredBoard, 'featured-board-' + player.localNumber);
            }

            UX.populateBoard(featuredBoardId, playerId);
            
            UX.featuredBoardEnter();
        };
    };
})(); 


UX.featuredBoardEnter = (function () {

    var setTerainToMonster = function () {
        uxState.currentTerrain = 'monster';

        document.querySelectorAll('.terrain-type').forEach(function(item){ 
            item.classList.remove('active'); 
            if (item.classList.contains('terrain-monster')) {
                item.classList.add('active'); 
            }
        });
    };

    var attachCloseButton = function () {
        document.querySelector('.featured-player-location .close-me')
            .addEventListener('click', UX.collapseFeaturedModal);
    };

    var startFeatureBoardTransition = function() {
        var modal = document.getElementById('featured-board-A');
        modal.classList.add('opaque');
        modal.classList.add('translate-shifting');

        var featuredBoard = modal.querySelector('.board-wrap');

        featuredBoard.style.transform = 'scale(1, 1) translate(0, 0)'; 

        setTerainToMonster();
        attachCloseButton();
        setTimeout(featuredBoardArrived, 400);
    };

    var featuredBoardArrived = function() {
        var modal = document.getElementById('featured-board-A');
        modal.classList.add('translate-arrived');
        modal.classList.remove('translate-shifting');
    };

    return function () {
        setTimeout(startFeatureBoardTransition, 10);
    };

})(); 

UX.collapseFeaturedModal = function () {
    var modal = document.getElementById('featured-board-A');
    modal.classList.remove('show');
    modal.classList.remove('opaque');
    modal.classList.remove('translate-shifting');
    modal.classList.remove('translate-arrived');

    UX.destroyFeaturedBoard();
};


UX.destroyFeaturedBoard = function() {
    var playerId;
    var target = document.getElementById('featured-board-target');
        
    // REMOVE ALL EVENT LISTENERS
    target.querySelectorAll('.game-square').forEach(function(el) {
        el.removeEventListener('click', UX.gameSquareListener);
    });

    document.querySelector('.featured-player-location .close-me')
        .removeEventListener('click', UX.collapseFeaturedModal);
    
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
    

})();  // MODULE WRAPPER

