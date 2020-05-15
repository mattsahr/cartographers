// ------- SHIM FOR el.closest() ----------
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// ------- SHIM FOR el.closest() ----------
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;

    do {
      if (Element.prototype.matches.call(el, s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

var createHTML = function (htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild; 
};

(function () {

'use strict';
var ISpin = window.ISpin;
var $ = window.$; // nano.js
var console = window.console;
var DEBUG = window.DEBUG;
var LOCAL_PLAYER_DEFAULT_ID = 'LOCAL_PLAYER_DEFAULT_ID';
var EMPTY_DATA_STRING = '[[],[],[],[],[],0]';

var methods = window.methods = window.methods || {};
var uxState = window.uxState = window.uxState || {}; 
var network = methods.network = methods.network || {}; 
var UX = methods.UX =  methods.UX || {};


UX.collectDataFromDOM = (function () {
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

    return function (gameBoardOrId, requestReturn) {

        var gameBoard = typeof gameBoardOrId === 'string'
            ? document.getElementById(gameBoardOrId)
            : gameBoardOrId;

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

        if (requestReturn) {
            return gameData;
        }
        
        uxState.gameState.playerState[playerId] = gameData;
        network.sendPlayerUpdate(playerId);
        
    };
})();

UX.composeDataToUX = function (sourceData) {
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


UX.updateAllBoards = function (player) {
    if (player.galleryBoardId) {
        UX.populateBoard(player.galleryBoardId, player.id);
    }
    if (player.featuredBoardId) {
        UX.populateBoard(player.featuredBoardId, player.id);
    }
    if (player.mainBoardId) {
        UX.populateBoard(player.mainBoardId, player.id);
    }
};    


UX.populateBoard = (function (){
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
    
    return function (currentBoardId, playerId) {
        var data = uxState.gameState.playerState[playerId];
        var boardId = currentBoardId === 'self-main-board' ? '' : currentBoardId;

        console.log(
            'player', playerId, 
            '  currentBoardIdardId', currentBoardId, 
            '  data', data
        );

        var board = document.getElementById(currentBoardId);
        if (board) {
            board.querySelectorAll('.game-square').forEach(removeAllTerrains);
        }

        terrains.forEach(function(terrain) {
            if (data[terrain]) {
                console.log('data[' + terrain + ']', data[terrain]);
                data[terrain].forEach(function (plot) {
                    var id = 'row_' + rowIndex[plot[1]] + '_cell_' + plot[0] + 
                        (boardId ? ('_' + boardId) : '');
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

    };
    
})();

UX.reconcileBoardType = function (gameDataProps) {
    var gameData = gameDataProps || uxState.gameState;

    var boardType = uxState.gameState.boardType = gameData.boardType || 'A';
    if (uxState.currentPlayBoard !== boardType) {
        uxState.currentPlayBoard = boardType;
        if (boardType === 'A') {
            UX.setupBoardA();
        } else {
            UX.setupBoardB();
        }
    }
};


UX.createNewGameUX = function (bType) {
    uxState.currentPlayBoard = bType;

    uxState.gameState = uxState.gameState = {
        boardType: bType,
        gameId: uxState.pendingGame,
        playerState: {}
    }
    UX.showPendingJoinUX();
};

UX.uponJoinApprovalUX = function () {
    var gameId = uxState.gameState.gameId;
    console.log('-------- uponJoinApprovalUX()  ' + gameId + '  --------------');

    if (gameId) {
        UX.showActiveGameUX();
        UX.setNetworkFooterUX();
        UX.setNetworkUX('on');

    } else {
        UX.setNetworkUX('off');
    }

};


UX.setupBoardA = (function() {

    var mountainCells = [
        'row_b_cell_4',
        'row_c_cell_9',
        'row_f_cell_6',
        'row_i_cell_3',
        'row_j_cell_8',
    ];
    
    var ruinsCells = [
        'row_b_cell_6',
        'row_c_cell_2',
        'row_c_cell_10',
        'row_i_cell_2',
        'row_i_cell_10',
        'row_j_cell_6',
    ];

    var allTerrains = [ 'forest', 'field', 'river', 'town', 'mountain', 'monster', 'ruins', 'crevasse'];

    return function(boardElement, boardId) {
    
        if (!boardElement) {
            uxState.currentPlayBoard = 'A';
            uxState.gameBoardStarted = false;
            clearScoreCards();
            dismissModal();
        }
        var i, id, el;
    
        (boardElement || document).querySelectorAll('.game-square').forEach(function(gameSquare2){
            for (i = 0; i < allTerrains.length; i++) {
                gameSquare2.classList.remove(allTerrains[i]);
            }
        });            
        
        for (i = 0; i < mountainCells.length; i++) {
            id = mountainCells[i] + (boardId ? '_' + boardId : '');
            el = document.getElementById(id);
            el.classList.add('mountain');
        }
        
        for (i = 0; i < ruinsCells.length; i++) {
            id = ruinsCells[i] + (boardId ? '_' + boardId : '');
            el = document.getElementById(id);
            el.classList.add('ruins');
        }
        
        console.groupCollapsed('setup A');
        console.log('boardElement', boardElement);
        console.log('boardId', boardId);
        console.groupEnd();

    };    
})();

UX.setupBoardB = (function() {
    var mountainCells = [
        'row_b_cell_9',
        'row_c_cell_4',
        'row_h_cell_6',
        'row_i_cell_10',
        'row_j_cell_3'
    ];
    
    var ruinsCells = [
        'row_b_cell_7',
        'row_c_cell_3',
        'row_e_cell_7',
        'row_g_cell_2',
        'row_h_cell_9',
        'row_j_cell_4'
    ];
    
    var crevasseCells = [
        'row_d_cell_6',
        'row_e_cell_5',
        'row_e_cell_6',
        'row_f_cell_5',
        'row_f_cell_6',
        'row_f_cell_7',
        'row_g_cell_6'
    ];
    
    var allTerrains = [ 'forest', 'field', 'river', 'town', 'mountain', 'monster', 'ruins', 'crevasse' ];

    return function(boardElement, player, firstPass) {
        
        if (!boardElement) {
            uxState.currentPlayBoard = 'B';
            uxState.gameBoardStarted = false;
            clearScoreCards();
            dismissModal();
        }
    
        var i, id, el;
    
        (boardElement || document).querySelectorAll('.game-square').forEach(function(square){
            for (i = 0; i < allTerrains.length; i++) {
                square.classList.remove(allTerrains[i]);
            }
        });            
        
        for (i = 0; i < mountainCells.length; i++) {
            id = mountainCells[i] + (player ? '_' + player : '');
            el = document.getElementById(id);
            el.classList.add('mountain');
        }
        
        for (i = 0; i < ruinsCells.length; i++) {
            id = ruinsCells[i] + (player ? '_' + player : '');
            el = document.getElementById(id);
            el.classList.add('ruins');
        }
    
        for (i = 0; i < crevasseCells.length; i++) {
            id = crevasseCells[i] + (player ? '_' + player : '');
            el = document.getElementById(id);
            el.classList.add('crevasse');
        }

        console.group('setup B');
        console.log('boardElement', boardElement);
        console.log('player', player);
        console.groupEnd();
        
    };        
})(); 

var initGoldCoinTracker = function () {
    document.querySelectorAll('.gold-coin').forEach(function(el) {
        el.addEventListener('click', function() {
            uxState.gameBoardStarted = true;
            if (this.classList.contains('active')) { 
                this.classList.remove('active');
            } else {
                this.classList.add('active');
            }
        });
    });
};

UX.gameSquareListener = (function () {
    var playTerrains = [ 'forest', 'town', 'river', 'field', 'monster' ];

    return function (event) {
        const target = event.target;
        if (!target.classList.contains('mountain') && !target.classList.contains('crevasse')) { 
            
            uxState.gameBoardStarted = true;

            for (var i = 0; i < playTerrains.length; i++) {
                var terrain = playTerrains[i];
                
                if (terrain === uxState.currentTerrain) {
                    if (target.classList.contains(terrain)) {
                        target.classList.remove(terrain);
                    } else {
                        target.classList.add(terrain);
                    }
                } else {
                    target.classList.remove(terrain);
                }
            }
            
            var gameBoard = target.closest('.board-wrap');
            UX.collectDataFromDOM(gameBoard);
        }
        
    };
})();

UX.initGameBoard = function (boardId) {
    document
        .getElementById(boardId)
        .querySelectorAll('.game-square')
        .forEach(function (el) {
            el.addEventListener('click', UX.gameSquareListener);
        });
};

var dismissModal = function() {
    document.querySelectorAll('.modal-panel').forEach(function (panel) {
        panel.classList.remove('warn-a');
        panel.classList.remove('warn-b');
    });
};

var clearScoreCards = function() {
    document.querySelectorAll('.score-input').forEach(function(input) {
        input.value = '';
    });

    document.querySelectorAll('.score-result').forEach(function(result) {
        result.innerHTML = '';
        result.setAttribute('data-score', '0');
    });

    document.querySelectorAll('.gold-coin').forEach(function(coin) {
        coin.classList.remove('active');
    });

    var final = document.getElementById('final-score');
    final.innerHTML = '';
};

var initBoardSwitcher = function() {

    var confirmA = function() {
        
        if (uxState.currentPlayBoard !== 'A') {
            if (uxState.gameBoardStarted) {
                document.querySelectorAll('.modal-panel').forEach(function (panel) {
                    panel.classList.remove('warn-b');
                    panel.classList.add('warn-a');
                });
            } else {
                clickChooseA();
            }
        } else {
            clickChooseA();
        }
    };
    
    var confirmB = function() {

        if (uxState.currentPlayBoard !== 'B') {
            if (uxState.gameBoardStarted) {
                document.querySelectorAll('.modal-panel').forEach(function (panel) {
                    panel.classList.remove('warn-a');
                    panel.classList.add('warn-b');
                });
            } else {
                clickChooseB();
            }
        } else {
            clickChooseB();
        }

    };
    
    var clickChooseA = function() {
        $('#selector-choice-a').addClass('active');
        $('#selector-choice-b').removeClass('active');

        UX.setupBoardA();
        UX.createNewGameUX('A')
        network.createNewGame();
    };
    
    var clickChooseB = function() {
        $('#selector-choice-a').removeClass('active');
        $('#selector-choice-b').addClass('active');
    
        UX.setupBoardB();
        UX.createNewGameUX('B')
        network.createNewGame();
    };

    var cancelNewGame = function () {
        UX.exitGameUX('cancelGameCreate');
    };

    $('#selector-choice-a').on('click', confirmA);
    $('#selector-choice-b').on('click', confirmB);
    $('#selector-choice-cancel').on('click', cancelNewGame);

    $('.confirm-inner.confirm-a .confirm-button.yes').on('click', clickChooseA);
    $('.confirm-inner.confirm-b .confirm-button.yes').on('click', clickChooseB);
    $('.confirm-inner .confirm-button.no').on('click', dismissModal);

};

var initScoreCards = function() {
    var scoreKeeper = {
        'final': function () {
            var score = 0;
            var localScore = 0;
            document.querySelectorAll('.score-result').forEach(function(result) {
                localScore = result.getAttribute('data-score');
                score += localScore ? Number(localScore) : 0;
            });
            
            var final = document.getElementById('final-score');
            final.innerHTML = score;
        },
        calc: function (season) {
            uxState.gameBoardStarted = true;
            var score = 0;
             document.querySelectorAll('#score-card-' + season + ' .score-input').forEach(function(input) {
                 score += input.value ? Number(input.value) : 0;
             });
            document.querySelectorAll('#score-card-' + season + ' .score-result').forEach(function(result) {
                result.innerHTML = score;
                result.setAttribute('data-score', score);
            });
            scoreKeeper.final();
        }
    };

    document.querySelectorAll('.score-card').forEach(function(card) {

        var season = card.getAttribute('data-season');
        card.querySelectorAll('.score-input').forEach(function(input) {
            
            var options = {
              wrapperClass: 'ispin-wrapper',
              buttonsClass: 'ispin-button',
              step: 1,
              pageStep: 10,
              disabled: false,
              repeatInterval: 200,
              wrapOverflow: false,
              parse: Number,
              format: String
            };
            
            if (input.classList.contains('score-monsters-input')) {
                options.max = 0;
            } else {
                options.min = 0;
            }
            
            
            options.onChange = function() {
                setTimeout(function() {
                    scoreKeeper.calc(season);
                }, 10);
            };
            
            new ISpin(input, options);
        });
    });
};

var initTerrainSwitcher = function () {
    
    var tiles = ['forest', 'field', 'river', 'town', 'monster'];
    
    document.querySelectorAll('.terrain-wrap').forEach(function (wrap) {
        tiles.forEach(function (tile) {
            wrap.appendChild(createHTML(
                '<div class="terrain-type terrain-' + tile + (tile === 'forest' ? ' active' : '') + '" ' + 
                'data-terrain="' + tile + '"><div class="terrain-inner"></div></div>'
            ))
        });
    });
    
    document.querySelectorAll('.terrain-type').forEach(function(el){
        el.addEventListener('click', function() {
            document.querySelectorAll('.terrain-type').forEach(function(item){ item.classList.remove('active'); });
            this.classList.add('active');
            uxState.currentTerrain = this.getAttribute('data-terrain');
        });
    });
};

UX.toggleAboutPanel = function (forceClose) {
    var aboutPanel = document.getElementById('about-panel');

    if (uxState.showAboutPanel || forceClose === 'forceClose') {
        uxState.showAboutPanel = false;
        document.querySelectorAll('.about-link').forEach(function(el){
            el.classList.remove('active');
        });
        aboutPanel.classList.remove('active');
    } else {
        uxState.showAboutPanel = true;
        document.querySelectorAll('.about-link').forEach(function(el){
            el.classList.add('active');
        });
        aboutPanel.classList.add('active');
    }
    
};

var initPageTitle = function () {
    var titleWrap = document.querySelector('.title-wrap');
    var letters = 'CARTOGRAPHERS'.split('');
    letters.forEach(function(letter) {
        titleWrap.appendChild(createHTML('<div class="letter">' + letter + '</div>'));
    })
    
    titleWrap.appendChild(createHTML(
        '<div class="about-link"><span class="question">?</span><span class="x-close">X</span></div>'
    ));

    document.querySelectorAll('.about-link').forEach(function(el){
        el.addEventListener('click', UX.toggleAboutPanel);
    });
};

var buildScoreCard = (function() {
    
    var buildInput = function(name) {
        var el = document.createElement('div');
        el.className = 'score-field score-field-' + name;
        el.innerHTML = '<input class="score-input score-' + name + '-input" ' +
            'type="number" min="0" pattern="[0-9]*" inputmode="numeric" />';
        
        return el;
    };
    
    var buildLeft = function() {
        var el =  document.createElement('div');
        el.className = 'score-card-left';
        
        var row1 = document.createElement('div');
        row1.className = 'score-row row-1';
        row1.appendChild(buildInput('field-a'));
        row1.appendChild(buildInput('field-b'));
        
        var row2 = document.createElement('div');
        row2.className = 'score-row row-2';
        row2.appendChild(buildInput('gold'));
        row2.appendChild(buildInput('monsters'));

        el.appendChild(row1);
        el.appendChild(row2);
        return el;
    };
    
    var buildRight = function() {
        var el = document.createElement('div');
        el.className = 'score-card-right';
        el.innerHTML = '<div class="score-result"></div>';
        return el;
    };

    return function(season) {
        var el = document.createElement('div');
        el.className = 'score-card';
        el.id = 'score-card-' + season;
        el.setAttribute('data-season', season);

        var title = document.createElement('div');
        title.className = 'score-card-title';
        title.innerHTML = season.toUpperCase();

        el.appendChild(title);
        el.appendChild(buildLeft());
        el.appendChild(buildRight());

        return el;
    };
})();

var buildScoreSection = function (parentNode) {
    parentNode.appendChild(buildScoreCard('spring'));
    parentNode.appendChild(buildScoreCard('summer'));
    parentNode.appendChild(buildScoreCard('fall'));
    parentNode.appendChild(buildScoreCard('winter'));

    var finalScore = document.createElement('div');
    finalScore.className = 'final-score-card';
    finalScore.innerHTML = '<div class="score-card-title">Final</div>' +
        '<div class="final-score-result" id="final-score"></div>';

    parentNode.appendChild(finalScore);
};

UX.buildGameBoard = (function() {
    var buildCell = (function(){

        var inner = '<div class="inner"></div>';

        var composeClass = function (row, cell) {
            if (row === 'l') {
                if (cell === 0) {
                    return 'cell label no-corner';
                }
                return 'cell number-label';
                }

            if (cell === 0) {
                return 'cell label';
            }
            return 'cell game-square';
        };

        var composeId = function (row, cell, player) {
            return 'row_' + row + '_cell_' + cell + (player ? '_' + player : '');
        };
        
        return function (row, cell, player) {
            var el = document.createElement('div');
            el.setAttribute('id', composeId(row, cell, player));
            el.className = composeClass(row, cell);
    
            if (row === 'l') {
                el.innerHTML = (cell === 0 ? ' ' : cell);
            } else {
                el.innerHTML = (cell === 0 ? row.toUpperCase() : inner);
            }
            
            return el;
        };
    })();
    
    var buildRow = (function(){
    
        var composeId  = function (row, player) {
            if (row === 'l') {
                return 'row_labels' + (player ? '_' + player : '');
            }
            
            return 'row_' + row +  (player ? '_' + player : '');
        };
    
        return function (row, player) {
            var el = document.createElement('div');
            el.className = row === 'l' ? 'row numbers-row' : 'row';
            el.setAttribute('id', composeId(row, player));
            var i = 0;
            while (i < 12) {
                el.appendChild(buildCell(row, i, player));
                i++;
            }
            return el;
        };
    })();
    
    var rowLetters = 'abcdefghijkl'.split('');
    
    return function (player, className) {
        var el =  document.createElement('div');
        el.className = 'board-wrap'+ (className ? ' ' + className : '');
        
        rowLetters.forEach(function(letter) {
            el.appendChild(buildRow(letter, player));
        });

        return el;
    };
})();

UX.resetMainBoardUX = function() {
    var gameData = UX.composeDataToUX(EMPTY_DATA_STRING);

    console.log('GAME DATA', gameData);

    var player = uxState.players.byId[uxState.localPlayerId] || 
        {
            id: uxState.localPlayerId,
            name: uxState.localPlayerName,
            mainBoardId: 'self-main-board'        
        };

    player.data = gameData;

    uxState.players.byId[uxState.localPlayerId] = player;
    uxState.players.byName[uxState.localPlayerName] = player;
    uxState.players.byNumber[0] = player;

    uxState.gameState.playerState[uxState.localPlayerId] = gameData;
    UX.updateAllBoards(player);
    clearScoreCards();
}

var initResetButton = (function() {

    var panelCloser = function (evt) {
        var el = document.getElementById('board-reset-confirm-panel');
        var targetElement = evt.target; // clicked element
        
        while (targetElement) {
            if (targetElement === el) {
                // This is a click inside. Do nothing, just return.
                return;
            }
            // Go up the DOM
            targetElement = targetElement.parentNode;
        }
        document.removeEventListener('click', panelCloser);
        closeReset();
    };

    var resetMainBoard = function () {
        UX.resetMainBoardUX();
        network.resetMainBoard();
        closeReset();
    };


    var confirmReset = function () {
        var resetConfirmPanel = document.getElementById('board-reset-confirm-panel');
        console.log('CONFIRM RESET!', resetConfirmPanel);
        resetConfirmPanel.classList.add('show');
        setTimeout(function () { document.addEventListener('click', panelCloser); }, 50);

    };

    var closeReset = function () {
        var resetConfirmPanel = document.getElementById('board-reset-confirm-panel');
        resetConfirmPanel.classList.remove('show');
    };

    return function () {
        document.getElementById('board-reset-button')
            .addEventListener('click', confirmReset);

        document.getElementById('board-reset-confirm-button')
            .addEventListener('click', resetMainBoard);

        document.getElementById('board-reset-cancel-button')
            .addEventListener('click', closeReset);
    };

})();


var addCoins = function() {
    var element = document.getElementById('gold-coins-wrapper');

    var i =0;
    for (i; i < 14; i++) {
        var coin = document.createElement('div');
        coin.className = 'gold-coin';
        coin.innerHTML = '<div class="inner"></div>';
        element.appendChild(coin);
    }

    var resetWrap = document.createElement('div');
    resetWrap.classList.add('reset-board-wrap');
    resetWrap.setAttribute('alt', 'Reset Board');
    resetWrap.setAttribute('title', 'Reset Board');
    resetWrap.innerHTML = 
        '<div class="reset-confirm-panel" id="board-reset-confirm-panel">' +
            '<div class="message">Clear your whole board?</div>' +
            '<div class="button confirm" id="board-reset-confirm-button">Yes</div>' +
            '<div class="button cancel" id="board-reset-cancel-button">No</div>' +
        '</div>' +
        '<div class="reset-board-button" id="board-reset-button"></div>'

    element.appendChild(resetWrap);
};

var initOverviewMenu = function () {
    UX.menuCloser = function (evt) {
        var el = document.getElementById('network-overview');
        var targetElement = evt.target; // clicked element
        
        while (targetElement) {
            if (targetElement === el) {
                // This is a click inside. Do nothing, just return.
                return;
            }
            // Go up the DOM
            targetElement = targetElement.parentNode;
        }
        document.removeEventListener('click', UX.menuCloser);
        UX.closeNetworkOverview();
    };
    
    UX.closeNetworkOverview = function () {
        document.removeEventListener('click', UX.menuCloser);
        var panel = document.getElementById('network-overview');
        panel.classList.remove('opaque');
        panel.classList.remove('follow');
        if (panel.classList.contains('show')) {
            setTimeout(function () {
                var GSpanel = document.getElementById('network-overview');
                GSpanel.classList.remove('show');
            }, 100);
        }        
    };
    
    UX.openNetworkOverview = function () {
        var panel = document.getElementById('network-overview');
        panel.classList.add('show');
        setTimeout(function () {
            var pPanel = document.getElementById('network-overview');
            pPanel.classList.add('opaque');
            document.addEventListener('click', UX.menuCloser);
        }, 10);
    };
    
    var initOverviewButton = function() {
        document.getElementById('overview-button').addEventListener('click', function() {
            var panel = document.getElementById('network-overview');
            if (panel.classList.contains('opaque') || panel.classList.contains('show')) {
                UX.closeNetworkOverview();
            } else {
                UX.openNetworkOverview();
            }
        });
    };

    var updateStatusButton = function (type) {
        var gameId = uxState.gameState.gameId || uxState.pendingGame;
        var statusButton = document.getElementById('overview-button');
        switch (type) {
            case 'join': 
                statusButton.classList.add('join');
                statusButton.classList.remove('active');
                statusButton.classList.remove('pending');
                statusButton.innerHTML = 'JOIN';
                break;
            case 'pending':
                statusButton.classList.remove('join');
                statusButton.classList.remove('active');
                statusButton.classList.add('pending');
                statusButton.innerHTML = 
                    '<span class="pending-message">Waiting to Join...</span>' +
                    '<div class="pending-icon"></div>';
                break;
            case 'active':
                statusButton.classList.remove('join');
                statusButton.classList.remove('pending');
                statusButton.classList.add('active');

                statusButton.innerHTML = 
                    '<span class="label">JOINED:</span>' +
                    '<span class="data">' + gameId + '</span>' +
                    '<div class="change-settings-button"></div>';
                break;
            default:
                console.log('woo');
        }
    }

    UX.hideAllOverviewContents = function () {
        var joinGameInputs = document.getElementById('join-game-inputs-A');
        joinGameInputs.classList.remove('disabled');
        joinGameInputs.classList.add('hidden');

        var createGameWrap = document.getElementById('create-new-game-A');
        createGameWrap.classList.remove('show');

        var pendingCancel = document.getElementById('pending-cancel-wrap');
        pendingCancel.classList.remove('show');

        var exitGame = document.getElementById('game-exit-wrap');
        exitGame.classList.remove('show');
    };
    
    UX.cancelPendingJoinUX = function () {
        updateStatusButton('join');
        UX.hideAllOverviewContents();

        // SHOW JOIN GAME
        var joinGameInputs = document.getElementById('join-game-inputs-A');
        joinGameInputs.classList.remove('disabled');
        joinGameInputs.classList.remove('hidden');
    }

    UX.showPendingJoinUX = function () {
        UX.closeNetworkOverview();
        updateStatusButton('pending');
        UX.hideAllOverviewContents();

        // SHOW PENDING JOIN UX
        var pendingCancel = document.getElementById('pending-cancel-wrap');
        var pendingId = pendingCancel.querySelector('.game-id');
        pendingId.innerHTML = uxState.pendingGame;
        pendingCancel.classList.add('show');
    };
    
    UX.showActiveGameUX = function () {
        updateStatusButton('active');        
        UX.showExitGameUX();
    };
    
    UX.showExitGameUX = function () {
        UX.closeNetworkOverview();
        UX.hideAllOverviewContents();

        // SHOW EXIT GAME UX
        var exitGame = document.getElementById('game-exit-wrap');
        var exitId = exitGame.querySelector('.game-id');
        exitId.innerHTML = uxState.gameState.gameId;
        exitGame.classList.add('show');
    };
    
    UX.exitGameUX = function (cancelGameCreate) {
        console.log('EXIT GAME!');
        uxState.priorGame = uxState.pendingGame || uxState.gameState.gameId;
        UX.hideAllOverviewContents();
        updateStatusButton('join');

        // SHOW JOIN GAME
        $('#game-id-input').value[0].value = '';
        var joinGameInputs = document.getElementById('join-game-inputs-A');
        joinGameInputs.classList.remove('disabled');
        joinGameInputs.classList.remove('hidden');

        if (!cancelGameCreate) {
            UX.exitGameOpponentsUX();
            UX.exitGameNotifyUX();
        }
    };

    UX.saveLocalPlayer = function () {
        var playerNameInput = document.getElementById('player-name-input');
        uxState.localPlayerName = playerNameInput.value;
        uxState.localPlayerId = uxState.localPlayerName + uxState.localPlayerHashId;

        var playerObject = {
            name: uxState.localPlayerName,
            id: uxState.localPlayerId,
            mainBoardId: 'self-main-board',
        };

        uxState.players.byId[playerObject.id] = playerObject;
        uxState.players.byName[playerObject.name] = playerObject;
        uxState.players.byNumber[0] = playerObject;
    };

    UX.requestGameJoin = function (gameData) {
        uxState.pendingGame = gameData.id;
        UX.saveLocalPlayer();

        UX.showPendingJoinUX();
        network.requestGameJoin(gameData);
    };
    
    UX.showCreateGameUX = function (gameId) {
        console.log('showCreateGameUX', gameId);
        UX.hideAllOverviewContents();

        // SHOW CREATE GAME UX
        var createGameWrap = document.getElementById('create-new-game-A');
        createGameWrap.classList.add('show');
        document.getElementById('message-new-game-id').innerHTML = gameId;
    };
    
    var savePlayerCheckGameId = function (e) {
        if (e.target.getAttribute('disabled')) {
            return false;
        }
        UX.saveLocalPlayer();

        document.getElementById('join-game-inputs-A').classList.add('disabled')

        var gameIdInput = document.getElementById('game-id-input');
        var gameId = gameIdInput.value;

        network.checkGameId(gameId).then(function(results) {
            if (results) {
                UX.requestGameJoin(results)
            } else {
                uxState.pendingGame = gameId;
                UX.showCreateGameUX(gameId);
            }
        });

    };
    
    var monitorInputs = function (e) {
        var playerNameInput = document.getElementById('player-name-input');
        var gameIdInput = document.getElementById('game-id-input');
        var joinButton = document.getElementById('join-button-A');

        if (e.key === 'Enter') {
            if (e.target.id === 'player-name-input') {
                gameIdInput.focus();
            }
        }
        
        var goodName = playerNameInput && playerNameInput.value.length > 2;

        var goodGame = gameIdInput && gameIdInput.value.length > 2;

        if (!goodName && playerNameInput.value && playerNameInput.value.length > 0) {
            document.getElementById('player-name-input-error').classList.add('show');
        }
        
        if (!goodGame && gameIdInput.value && gameIdInput.value.length > 0) {
            document.getElementById('game-id-input-error').classList.add('show');
        }
        
        if (goodName) {
            document.getElementById('player-name-input-error').classList.remove('show');
        }
        
        if (goodGame) {
            document.getElementById('game-id-input-error').classList.remove('show');
        }
        
        if (goodName && goodGame) {
            joinButton.removeAttribute('disabled');
            if (e.key === 'Enter' && e.target.id === 'game-id-input') {
                savePlayerCheckGameId(e);
            }
        } else {
            joinButton.setAttribute('disabled', 'true');
        }
    };

    var initOverviewInputs = function() {
        var joinButton = document.getElementById('join-button-A');
        var playerNameInput = document.getElementById('player-name-input');
        var gameIdInput = document.getElementById('game-id-input');
        
        joinButton.addEventListener('click', savePlayerCheckGameId);
        gameIdInput.addEventListener('keyup', monitorInputs);
        playerNameInput.addEventListener('keyup', monitorInputs);
    }
    
    UX.cancelPendingJoin = function () {
        UX.cancelPendingJoinUX();
        network.cancelPendingJoin();
    };
    
    UX.exitGame = function () {
        UX.exitGameUX();
        network.exitGame();
    };

    var initPanelButtons = function () {
        var cancelButton = document.getElementById('cancel-join');
        var exitButton =  document.getElementById('game-exit');
        
        cancelButton.addEventListener('click', UX.cancelPendingJoin);
        exitButton.addEventListener('click', UX.exitGame);
    };
    
    initPanelButtons();
    initOverviewButton();
    initOverviewInputs();
}

UX.initializeSelf = function (id, update) {
    update.mainBoardId = 'self-main-board';
    uxState.players.byId[id] = update;
    uxState.players.byNumber[0] = update;
    if (update.name) {
        uxState.players.byName[update.name] = update;
    }

    if (update.data) {
        uxState.gameState.playerState[id] = update.data;
    }
};

var initFeaturedModal = function () {
    document.querySelector('.featured-board-modal .modal-background')
        .addEventListener('click', UX.collapseFeaturedModal)
};

UX.localInit = function() {
    initPageTitle();
    initOverviewMenu();
    initTerrainSwitcher();
    UX.initGameBoard('self-main-board');
    initGoldCoinTracker();
    initScoreCards();
    initBoardSwitcher();
    initFeaturedModal();
    initResetButton();
};

UX.buildMainDom = function() {
    var mainBoard = UX.buildGameBoard();
    mainBoard.setAttribute('id', 'self-main-board');
    document.getElementById('board-location').appendChild(mainBoard);
    buildScoreSection(document.getElementById('score-cards-section'));
    addCoins();
};

})();
