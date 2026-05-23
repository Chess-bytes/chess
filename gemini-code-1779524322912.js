const database = {
    profile: {
        kasparov: {
            title: "Garry Kasparov",
            meta: "<span class='badge'>World Champion</span><span class='badge'>Peak: 2851</span>",
            bio: "Kasparov became the youngest undisputed World Champion in 1985 at age 22. Click through his attacking masterpiece against Topalov (1999) or turn on 'Play Mode' to test your own moves!",
            moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "Qd2", "c6", "f3", "b5"],
            evals: [0.3, 0.2, 0.4, 0.3, 0.3, 0.2, 0.4, 0.3, 0.5, 0.4, 0.6, 0.5]
        },
        fischer: {
            title: "Bobby Fischer",
            meta: "<span class='badge'>World Champion</span><span class='badge'>Born: USA</span>",
            bio: "Bobby Fischer single-handedly broke the Soviet hegemony over the chess world. Click through or practice against the computer below.",
            moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
            evals: [0.3, 0.4, 0.3, 0.4, 0.4, 0.3, 0.4, 0.3, 0.4, 0.4]
        }
    },
    game: {
        gotc: {
            title: "The Game of the Century",
            meta: "<span class='badge'>Year: 1956</span><span class='badge'>Fischer vs. Byrne</span>",
            bio: "A 13-year-old Bobby Fischer unloads a brilliant queen sacrifice, proving stunning tactical foresight that shocked the chess elite.",
            moves: ["Nf3", "Nf6", "c4", "g6", "Nc3", "Bg7", "d4", "O-O", "Bf4", "d5"],
            evals: [0.1, 0.1, 0.2, 0.1, 0.2, 0.2, 0.3, 0.2, 0.4, -0.2]
        },
        immortal: {
            title: "The Immortal Game",
            meta: "<span class='badge'>Year: 1851</span><span class='badge'>Romantic Era</span>",
            bio: "Adolf Anderssen sacrifices a bishop, both rooks, and finally his queen to force a mesmerizing checkmate against Lionel Kieseritzky.",
            moves: ["e4", "e5", "f4", "exf4", "Bc4", "Qh4+", "Kf1", "b5", "Bxb5"],
            evals: [0.3, 0.3, 0.7, 0.5, 0.6, 1.2, 1.1, 0.9, 1.3]
        }
    },
    article: {
        positional: {
            title: "Mastering Space & Pawn Frameworks",
            meta: "<span class='badge'>Strategy Guide</span><span class='badge'>Difficulty: Int.</span>",
            bio: "Chess isn't purely about immediate tactical strikes; controlling squares is what builds winning positions. Look at how early spatial development influences options.",
            moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
            evals: [0.3, 0.3, 0.4, 0.3, 0.4]
        }
    }
};

let board = null;
let gameEngine = new Chess();
let moveHistory = [];
let staticEvals = [];
let currentMoveIndex = -1;
let appMode = 'review'; 

// Safely play sound (browsers block audio until the user clicks something)
function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') return; 
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'capture' ? 240 : 180, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        console.warn("Audio not supported or blocked by browser.");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    setupBoard('start');
    
    document.getElementById('tab-profiles').addEventListener('click', () => switchTab('profiles', 'tab-profiles'));
    document.getElementById('tab-games').addEventListener('click', () => switchTab('games', 'tab-games'));
    document.getElementById('tab-articles').addEventListener('click', () => switchTab('articles', 'tab-articles'));

    document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', function() {
            loadContent(this.getAttribute('data-type'), this.getAttribute('data-id'));
        });
    });

    document.getElementById('prevBtn').addEventListener('click', () => stepMove(-1));
    document.getElementById('nextBtn').addEventListener('click', () => stepMove(1));
    document.getElementById('modeBtn').addEventListener('click', togglePlayMode);
});

function setupBoard(position) {
    const config = {
        draggable: appMode === 'play',
        position: position,
        onDragStart: (src, piece) => {
            if (gameEngine.game_over()) return false;
            if ((gameEngine.turn() === 'w' && piece.search(/^b/) !== -1) ||
                (gameEngine.turn() === 'b' && piece.search(/^w/) !== -1)) {
                return false;
            }
        },
        onDrop: (src, target) => {
            let move = gameEngine.move({ from: src, to: target, promotion: 'q' });
            if (move === null) return 'snapback';
            
            playSound(move.captured ? 'capture' : 'move');
            updateEvaluationBar(null);
            updateStatusBanner();
            
            if (!gameEngine.game_over()) {
                window.setTimeout(makeComputerMove, 400);
            }
        }
    };
    board = Chessboard('board', config);
}

function switchTab(panelId, buttonId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.content-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(buttonId).classList.add('active');
    document.getElementById(panelId).classList.add('active');
}

function loadContent(type, id) {
    const data = database[type][id];
    if (!data) return;

    document.getElementById('displayTitle').innerText = data.title;
    document.getElementById('displayMeta').innerHTML = data.meta;
    document.getElementById('displayBody').innerText = data.bio;

    gameEngine.reset();
    moveHistory = data.moves;
    staticEvals = data.evals || [];
    currentMoveIndex = -1;

    appMode = 'review';
    const modeBtn = document.getElementById('modeBtn');
    modeBtn.innerText = "Review Mode";
    modeBtn.classList.remove('vs-computer');

    setupBoard('start');
    buildNotationLog();
    updateButtons();
    updateEvaluationBar(0.0);
    document.getElementById('gameStatus').innerText = "";
}

function buildNotationLog() {
    const logContainer = document.getElementById('moveList');
    logContainer.innerHTML = '';
    moveHistory.forEach((move, index) => {
        const prefix = (index % 2 === 0) ? `${Math.floor(index / 2) + 1}. ` : '';
        const node = document.createElement('div');
        node.className = 'move-node';
        node.id = `move-node-${index}`;
        node.innerText = `${prefix}${move}`;
        node.addEventListener('click', () => {
            if (appMode === 'review') jumpToMoveIndex(index);
        });
        logContainer.appendChild(node);
    });
}

function stepMove(direction) {
    if (appMode !== 'review') return;
    if (direction === 1 && currentMoveIndex < moveHistory.length - 1) {
        currentMoveIndex++;
        gameEngine.move(moveHistory[currentMoveIndex]);
        playSound('move');
    } else if (direction === -1 && currentMoveIndex >= 0) {
        gameEngine.undo();
        currentMoveIndex--;
        playSound('move');
    }
    board.position(gameEngine.fen());
    updateButtons();
    highlightMoveNode();
    updateEvaluationBar(staticEvals[currentMoveIndex] || 0.0);
}

function jumpToMoveIndex(targetIndex) {
    gameEngine.reset();
    for (let i = 0; i <= targetIndex; i++) gameEngine.move(moveHistory[i]);
    currentMoveIndex = targetIndex;
    board.position(gameEngine.fen());
    playSound('move');
    updateButtons();
    highlightMoveNode();
    updateEvaluationBar(staticEvals[currentMoveIndex] || 0.0);
}

function highlightMoveNode() {
    document.querySelectorAll('.move-node').forEach(n => n.classList.remove('active-move'));
    const active = document.getElementById(`move-node-${currentMoveIndex}`);
    if (active) active.classList.add('active-move');
}

function updateEvaluationBar(customScore) {
    let score = customScore;
    
    if (score === null) {
        score = 0.0;
        const weights = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        gameEngine.board().forEach(row => {
            row.forEach(piece => {
                if (piece) {
                    const val = weights[piece.type];
                    score += (piece.color === 'w') ? val : -val;
                }
            });
        });
    }

    const fillPercent = Math.max(5, Math.min(95, 50 + (score * 5)));
    document.getElementById('evalBar').style.height = `${fillPercent}%`;
    document.getElementById('evalScore').innerText = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
}

function togglePlayMode() {
    const modeBtn = document.getElementById('modeBtn');
    if (appMode === 'review') {
        appMode = 'play';
        modeBtn.innerText = "VS Computer";
        modeBtn.classList.add('vs-computer');
        document.getElementById('gameStatus').innerText = "Your turn! Make a legal move on the board.";
    } else {
        appMode = 'review';
        modeBtn.innerText = "Review Mode";
        modeBtn.classList.remove('vs-computer');
        document.getElementById('gameStatus').innerText = "";
    }
    setupBoard(gameEngine.fen());
    updateButtons();
}

function makeComputerMove() {
    if (appMode !== 'play' || gameEngine.game_over()) return;
    
    // Get all legal moves
    const moves = gameEngine.moves({ verbose: true });
    if (moves.length === 0) return;

    // Simple AI: Capture a piece if possible, otherwise move randomly
    let chosenMove = moves[Math.floor(Math.random() * moves.length)];
    for (let m of moves) {
        if (m.captured) {
            chosenMove = m;
            break;
        }
    }
    
    gameEngine.move(chosenMove.san);
    board.position(gameEngine.fen());
    playSound(chosenMove.captured ? 'capture' : 'move');
    updateEvaluationBar(null);
    updateStatusBanner();
}

function updateStatusBanner() {
    const banner = document.getElementById('gameStatus');
    if (gameEngine.in_checkmate()) banner.innerText = "Checkmate! Game Over.";
    else if (gameEngine.in_draw()) banner.innerText = "Draw Game!";
    else if (gameEngine.in_check()) banner.innerText = "Check!";
    else if (appMode === 'play') banner.innerText = "Your turn.";
}

function updateButtons() {
    const isReview = (appMode === 'review');
    document.getElementById('prevBtn').disabled = !isReview || (currentMoveIndex < 0);
    document.getElementById('nextBtn').disabled = !isReview || (currentMoveIndex >= moveHistory.length - 1);
}
