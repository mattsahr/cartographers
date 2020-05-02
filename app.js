(function () {
"use strict";

var currentTerrain = 'forest';
var currentPlayBoard = 'A';
var gameBoardStarted = false;

var playTerrains = [ 'forest', 'town', 'river', 'field', 'monster' ];

var dismissModal = function() {
    document.querySelectorAll('.modal-panel').forEach(function (panel) {
        panel.classList.remove('warn-a');
        panel.classList.remove('warn-b');
    });
};

var initBoardSwitcher = function() {
    
    var confirmA = function() {
        if (currentPlayBoard !== 'A') {
            if (gameBoardStarted) {
                document.querySelectorAll('.modal-panel').forEach(function (panel) {
                    panel.classList.remove('warn-b');
                    panel.classList.add('warn-a');
                });
            } else {
                setupA();
            }
        }
    };
    
    var confirmB = function() {
        if (currentPlayBoard !== 'B') {
            if (gameBoardStarted) {
                document.querySelectorAll('.modal-panel').forEach(function (panel) {
                    panel.classList.remove('warn-a');
                    panel.classList.add('warn-b');
                });
            } else {
                setupB();
            }
        }
    };
    

    var chooseA = document.getElementById('selector-choice-a');
    var chooseB = document.getElementById('selector-choice-b');
    
    chooseA.addEventListener('click', confirmA);
    chooseB.addEventListener('click', confirmB);
    
    document.querySelectorAll('.confirm-inner.confirm-a .confirm-button.yes').forEach(function (yesA) {
        yesA.addEventListener('click', setupA);
    });
    
    document.querySelectorAll('.confirm-inner.confirm-b .confirm-button.yes').forEach(function (yesB) {
        yesB.addEventListener('click', setupB);
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
            gameBoardStarted = true;
            var score = 0;
             document.querySelectorAll('#score-card-' + season + ' .score-input').forEach(function(input) {
                 score += input.value ? Number(input.value) : 0;
             });
            document.querySelectorAll('#score-card-' + season + ' .score-result').forEach(function(result) {
                result.innerHTML = score;
                result.setAttribute("data-score", score);
            });
            scoreKeeper.final();
        }
    };

    document.querySelectorAll('.score-card').forEach(function(card) {
        var season = card.getAttribute('data-season');
        card.querySelectorAll('.score-input').forEach(function(input){
            input.addEventListener('change', function() {
                scoreKeeper.calc(season);
            });
        });
        
    });
};

var initTerrainSwitcher = function () {
    document.querySelectorAll('.terrain-type').forEach(function(el){
        el.addEventListener('click', function() {
            document.querySelectorAll('.terrain-type').forEach(function(item){ item.classList.remove('active'); });
            this.classList.add('active');
            currentTerrain = this.getAttribute('data-terrain');
        });
    });
};

var initGameBoard = function () {
    document.querySelectorAll('.game-square').forEach(function(el){
        el.addEventListener('click', function() {
            
            if (!this.classList.contains('mountain') && !this.classList.contains('crevasse')) { 
                
                gameBoardStarted = true;

                for (var i = 0; i < playTerrains.length; i++) {
                    var terrain = playTerrains[i];
                    
                    if (terrain === currentTerrain) {
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

var initGoldCoinTracker = function () {
    document.querySelectorAll('.gold-coin').forEach(function(el){
        el.addEventListener('click', function() {
            gameBoardStarted = true;
            if (this.classList.contains('active')) { 
                this.classList.remove('active');
            } else {
                this.classList.add('active');
            }
        });
    });
};

var gameInit = function() {
    initTerrainSwitcher();
    initGameBoard();
    initGoldCoinTracker();
    initScoreCards();
    initBoardSwitcher();
};

var clearScoreCards = function() {
     document.querySelectorAll('.score-input').forEach(function(input) {
         input.value = '';
     });
    document.querySelectorAll('.score-result').forEach(function(result) {
        result.innerHTML = '';
        result.setAttribute("data-score", 0);
    });
    var final = document.getElementById('final-score');
    final.innerHTML = '';

    
    document.querySelectorAll('.gold-coin').forEach(function(coin) {
        coin.classList.remove('active');
    });
};

var setupA = function() {

    var chooseA = document.getElementById('selector-choice-a');
    var chooseB = document.getElementById('selector-choice-b');
    chooseA.classList.add('active');
    chooseB.classList.remove('active');
    currentPlayBoard = 'A';
    gameBoardStarted = false;
    clearScoreCards();
    dismissModal();

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
    
    var i, id, el;
    var allTerrains = [ 'forest', 'field', 'river', 'town', 'mountain', 'monster', 'ruins', 'crevasse'];

    document.querySelectorAll('.game-square').forEach(function(el){
        for (i = 0; i < allTerrains.length; i++) {
            el.classList.remove(allTerrains[i]);
        }
    });            
    
    for (i = 0; i < mountainCells.length; i++) {
        id = mountainCells[i];
        el = document.getElementById(id);
        el.classList.add('mountain');
    }
    
    for (i = 0; i < ruinsCells.length; i++) {
        id = ruinsCells[i];
        el = document.getElementById(id);
        el.classList.add('ruins');
    }
};

var setupB = function() {

    var chooseA = document.getElementById('selector-choice-a');
    var chooseB = document.getElementById('selector-choice-b');

    chooseA.classList.remove('active');
    chooseB.classList.add('active');
    currentPlayBoard = 'B';
    gameBoardStarted = false;
    clearScoreCards();
    dismissModal();

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
    
    var i, id, el;
    var allTerrains = [ 'forest', 'field', 'river', 'town', 'mountain', 'monster', 'ruins', 'crevasse' ];

    document.querySelectorAll('.game-square').forEach(function(el){
        for (i = 0; i < allTerrains.length; i++) {
            el.classList.remove(allTerrains[i]);
        }
    });            
    
    for (i = 0; i < mountainCells.length; i++) {
        id = mountainCells[i];
        el = document.getElementById(id);
        el.classList.add('mountain');
    }
    
    for (i = 0; i < ruinsCells.length; i++) {
        id = ruinsCells[i];
        el = document.getElementById(id);
        el.classList.add('ruins');
    }

    for (i = 0; i < crevasseCells.length; i++) {
        id = crevasseCells[i];
        el = document.getElementById(id);
        el.classList.add('crevasse');
    }

};


window.addEventListener('DOMContentLoaded', function (event) {
    gameInit();
    setupA();
});

})();
