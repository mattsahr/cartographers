(function () {
'use strict';

var methods = window.methods = window.methods || {};
var uxStatus = window.uxStatus = window.uxStatus || {}; 
var constants = window.constants = window.constants || {}; 
var ISpin = window.ISpin;


methods.setupBoardA = (function() {

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

    return function(boardElement, player) {
    
        if (!boardElement) {
            uxStatus.currentPlayBoard = 'A';
            uxStatus.gameBoardStarted = false;
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
            id = mountainCells[i] + (player ? '_' + player : '');
            el = document.getElementById(id);
            el.classList.add('mountain');
        }
        
        for (i = 0; i < ruinsCells.length; i++) {
            id = ruinsCells[i] + (player ? '_' + player : '');
            el = document.getElementById(id);
            el.classList.add('ruins');
        }
        
        console.group('setup A');
        console.log('boardElement', boardElement);
        console.log('player', player);
        console.groupEnd();

    };    
})();

methods.setupBoardB = (function() {
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
            uxStatus.currentPlayBoard = 'B';
            uxStatus.gameBoardStarted = false;
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
            uxStatus.gameBoardStarted = true;
            if (this.classList.contains('active')) { 
                this.classList.remove('active');
            } else {
                this.classList.add('active');
            }
        });
    });
};


var initGameBoard = function () {
    document.querySelectorAll('.game-square').forEach(function(el){
        el.addEventListener('click', function() {
            
            if (!this.classList.contains('mountain') && !this.classList.contains('crevasse')) { 
                
                uxStatus.gameBoardStarted = true;

                for (var i = 0; i < constants.playTerrains.length; i++) {
                    var terrain = constants.playTerrains[i];
                    
                    if (terrain === uxStatus.currentTerrain) {
                        if (this.classList.contains(terrain)) {
                            this.classList.remove(terrain);
                        } else {
                            this.classList.add(terrain);
                        }
                    } else {
                        this.classList.remove(terrain);
                    }
                }

            }
        });
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
    var final = document.getElementById('final-score');
    final.innerHTML = '';

    
    document.querySelectorAll('.gold-coin').forEach(function(coin) {
        coin.classList.remove('active');
    });
};


var initBoardSwitcher = function() {
    
    var confirmA = function() {
        
        console.log('confirmA uxState.currentPlayBoard', uxState.currentPlayBoard);
        
        if (uxState.currentPlayBoard !== 'A') {
            if (uxState.gameBoardStarted) {
                document.querySelectorAll('.modal-panel').forEach(function (panel) {
                    panel.classList.remove('warn-b');
                    panel.classList.add('warn-a');
                });
            } else {
                clickChooseA()
            }
        }
    };
    
    var confirmB = function() {

        console.log('confirmA uxState.currentPlayBoard', uxState.currentPlayBoard);

        if (uxState.currentPlayBoard !== 'B') {
            if (uxState.gameBoardStarted) {
                document.querySelectorAll('.modal-panel').forEach(function (panel) {
                    panel.classList.remove('warn-a');
                    panel.classList.add('warn-b');
                });
            } else {
                clickChooseB();
            }
        }
    };

    var chooseA = document.getElementById('selector-choice-a');
    var chooseB = document.getElementById('selector-choice-b');
    
    chooseA.addEventListener('click', confirmA);
    chooseB.addEventListener('click', confirmB);
    
    var clickChooseA = function() {
            var buttonA = document.getElementById('selector-choice-a');
            var buttonB = document.getElementById('selector-choice-b');
        
            buttonA.classList.add('active');
            buttonB.classList.remove('active');
            
            uxState.currentPlayBoard = 'A';
            methods.setupBoardA();
    };
    
    var clickChooseB = function() {
            var buttonA = document.getElementById('selector-choice-a');
            var buttonB = document.getElementById('selector-choice-b');
        
            buttonA.classList.remove('active');
            buttonB.classList.add('active');

            uxState.currentPlayBoard = 'B';
            methods.setupBoardB();
    };


    document.querySelectorAll('.confirm-inner.confirm-a .confirm-button.yes').forEach(function (yesA) {
        yesA.addEventListener('click', clickChooseA);
    });
    
    document.querySelectorAll('.confirm-inner.confirm-b .confirm-button.yes').forEach(function (yesB) {
        yesB.addEventListener('click', clickChooseB);
    });
    
    document.querySelectorAll('.confirm-inner .confirm-button.no').forEach(function (noButton) {
        noButton.addEventListener('click', dismissModal);
    });

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
            uxStatus.gameBoardStarted = true;
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
    document.querySelectorAll('.terrain-type').forEach(function(el){
        el.addEventListener('click', function() {
            document.querySelectorAll('.terrain-type').forEach(function(item){ item.classList.remove('active'); });
            this.classList.add('active');
            uxStatus.currentTerrain = this.getAttribute('data-terrain');
        });
    });
};

methods.toggleAboutPanel = function (forceClose) {
    var aboutPanel = document.getElementById('about-panel');

    if (uxStatus.showAboutPanel || forceClose === 'forceClose') {
        uxStatus.showAboutPanel = false;
        document.querySelectorAll('.about-link').forEach(function(el){
            el.classList.remove('active');
        });
        aboutPanel.classList.remove('active');
    } else {
        uxStatus.showAboutPanel = true;
        document.querySelectorAll('.about-link').forEach(function(el){
            el.classList.add('active');
        });
        aboutPanel.classList.add('active');
    }
    
};

var initAboutButton = function () {
    document.querySelectorAll('.about-link').forEach(function(el){
        el.addEventListener('click', methods.toggleAboutPanel);
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

methods.buildGameBoard = (function() {
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

var addCoins = function() {
    var element = document.getElementById('gold-coins-wrapper');

    var i =0;
    for (i; i < 14; i++) {
        var coin = document.createElement('div');
        coin.className = 'gold-coin';
        coin.innerHTML = '<div class="inner"></div>';
        element.appendChild(coin);
    }
};

var initOverviewMenu = function () {
    var menuCloser = function (evt) {
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
        document.removeEventListener('click', menuCloser);
        methods.closeNetworkOverview();
    };
    
    methods.closeNetworkOverview = function () {
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
    
    methods.openNetworkOverview = function () {
        var panel = document.getElementById('network-overview');
        panel.classList.add('show');
        setTimeout(function () {
            var pPanel = document.getElementById('network-overview');
            pPanel.classList.add('opaque');
            document.addEventListener('click', menuCloser);
        }, 10);
    };
    
    var initOverviewButton = function() {
        document.getElementById('overview-button').addEventListener('click', function() {
            var panel = document.getElementById('network-overview');
            if (panel.classList.contains('opaque') || panel.classList.contains('show')) {
                methods.closeNetworkOverview();
            } else {
                methods.openNetworkOverview();
            }
        });
    };
    
    methods.cancelPendingJoinUX = function () {
        var statusButton = document.getElementById('overview-button');
        statusButton.classList.add('join');
        statusButton.classList.remove('active');
        statusButton.classList.remove('pending');
        statusButton.innerHTML = 'JOIN';
        
        var joinGameInputs = document.getElementById('join-game-inputs-A');
        joinGameInputs.classList.remove('disabled');
        joinGameInputs.classList.add('hidden');

        var pendingCancel = document.getElementById('pending-cancel-wrap');
        var pendingId = pendingCancel.querySelector('.game-id');
        pendingId.innerHTML = '';
        pendingCancel.classList.remove('show');
    }

    methods.showPendingJoinUX = function () {
        methods.closeNetworkOverview();

        var statusButton = document.getElementById('overview-button');
        statusButton.classList.remove('join');
        statusButton.classList.remove('active');
        statusButton.classList.add('pending');
        statusButton.innerHTML = 
            '<span class="pending-message">Waiting to Join...</span>' +
            '<div class="pending-icon"></div>';

        var joinGameInputs = document.getElementById('join-game-inputs-A');
        joinGameInputs.classList.remove('disabled');
        joinGameInputs.classList.add('hidden');
        
        var pendingCancel = document.getElementById('pending-cancel-wrap');
        var pendingId = pendingCancel.querySelector('.game-id');
        pendingId.innerHTML = uxState.pendingGame;
        pendingCancel.classList.add('show');
    };
    
    methods.requestGameJoin = function (gameData) {
        console.log('methods.requestGameJoin', gameData);
        var playerNameInput = document.getElementById('player-name-input');

        uxState.localPlayerName = playerNameInput.value;
        uxState.localPlayerId = uxState.localPlayerName + uxState.localPlayerHashId;
        uxState.pendingGame = gameData.id;

        methods.showPendingJoinUX();
        methods.network.requestGameJoin(gameData);
    };
    
    methods.showCreateGameUX = function (gameId) {
        console.log('showCreateGameUX', gameId);
    };
    
    var checkGameId = function (e) {
        if (e.target.getAttribute('disabled')) {
            return false;
        }
        var gameIdInput = document.getElementById('game-id-input');
        var gameId = gameIdInput.value;

        document.getElementById('join-game-inputs-A').classList.add('disabled')
        
        methods.network.checkGameId( gameId).then(function(results) {
            if (results) {
                methods.requestGameJoin(results)
            } else {
                methods.showCreateGameUX(gameId);
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
                checkGameId(e);
            }
        } else {
            joinButton.setAttribute('disabled', 'true');
        }
    };

    var initOverviewInputs = function() {
        var joinButton = document.getElementById('join-button-A');
        var playerNameInput = document.getElementById('player-name-input');
        var gameIdInput = document.getElementById('game-id-input');
        
        joinButton.addEventListener('click', checkGameId);
        gameIdInput.addEventListener('keyup', monitorInputs);
        playerNameInput.addEventListener('keyup', monitorInputs);
    }
    
    
    initOverviewButton();
    initOverviewInputs();
}

var initFeaturedModal = function () {
    document.querySelector('.featured-board-modal .modal-background')
        .addEventListener('click', methods.collapseFeaturedModal)
};

methods.localInit = function() {
    initAboutButton();
    initOverviewMenu();
    initTerrainSwitcher();
    initGameBoard();
    initGoldCoinTracker();
    initScoreCards();
    initBoardSwitcher();
    initFeaturedModal();
};

methods.buildMainDom = function() {
    document.getElementById('board-location').appendChild(methods.buildGameBoard());
    buildScoreSection(document.getElementById('score-cards-section'));
    addCoins();
};

})();
