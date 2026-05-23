// Database of Chess Hub Content
const database = {
    profile: {
        kasparov: {
            title: "Garry Kasparov",
            meta: "<span class='badge'>World Champion: 1985–2000</span><span class='badge'>Peak Rating: 2851</span>",
            bio: "Widely considered one of the greatest players of all time, Kasparov became the youngest ever undisputed World Chess Champion in 1985 at age 22. Below is his famous attacking masterpiece against Topalov in 1999.",
            moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "Qd2", "c6", "f3", "b5", "Nge2", "Nbd7", "Bh6"]
        },
        fischer: {
            title: "Bobby Fischer",
            meta: "<span class='badge'>World Champion: 1972–1975</span><span class='badge'>Born: USA</span>",
            bio: "Bobby Fischer single-handedly broke the Soviet hegemony over the chess world during the height of the Cold War by defeating Boris Spassky in 1972. Try navigating his clean tactical lines below.",
            moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Bc4", "e6", "Bb3", "b5"]
        }
    },
    game: {
        gotc: {
            title: "The Game of the Century",
            meta: "<span class='badge'>Year: 1956</span><span class='badge'>White: D. Byrne</span><span class='badge'>Black: R. Fischer</span>",
            bio: "A 13-year-old Bobby Fischer unloads a brilliant queen sacrifice, proving stunning tactical foresight that shocked the chess elite.",
            moves: ["Nf3", "Nf6", "c4", "g6", "Nc3", "Bg7", "d4", "O-O", "Bf4", "d5", "Qb3", "dxc4", "Qxc4", "c6", "e4", "Nbd7"]
        },
        immortal: {
            title: "The Immortal Game",
            meta: "<span class='badge'>Year: 1851</span><span class='badge'>Romantic Era Chess</span>",
            bio: "Adolf Anderssen sacrifices a bishop, both rooks, and finally his queen to force a mesmerizing checkmate against Lionel Kieseritzky.",
            moves: ["e4", "e5", "f4", "exf4", "Bc4", "Qh4+", "Kf1", "b5", "Bxb5", "Nf6", "Nf3", "Qh6", "d3"]
        }
    },
    article: {
        positional: {
            title: "Mastering Space & Pawn Frameworks",
            meta: "<span class='badge'>Strategy Guide</span><span class='badge'>Difficulty: Intermediate</span>",
            bio: "Chess isn't purely about immediate tactical strikes; controlling squares is what builds winning positions. Look at how early spatial development influences options: the e4 opening framework stakes a claim on critical central territory early on.",
            moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"]
        }
    }
};

// Application State
let board = null;
let gameEngine = new Chess();
let moveHistory = [];
let currentMoveIndex = -1;

// Run initialization logic as soon as DOM Content is parsed safely
document.addEventListener("DOMContentLoaded", function() {
    
    // Initialize standard chessboard layout
    board = Chessboard('board', 'start');
    updateButtons();

    // Tab Event Setup
    document.getElementById('tab-profiles').addEventListener('click', () => switchTab('profiles', 'tab-profiles'));
    document.getElementById('tab-games').addEventListener('click', () => switchTab('games', 'tab-games'));
    document.getElementById('tab-articles').addEventListener('click', () => switchTab('articles', 'tab-articles'));

    // Menu Selection Handling
    const listItems = document.querySelectorAll('.list-item');
    listItems.forEach(item => {
        item.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const id = this.getAttribute('data-id');
            loadContent(type, id);
        });
    });

    // Control Buttons
    document.getElementById('prevBtn').addEventListener('click', () => stepMove(-1));
    document.getElementById('nextBtn').addEventListener('click', () => stepMove(1));
});

// Tab Toggling Functionality
function switchTab(panelId, buttonId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.content-panel').forEach(panel => panel.classList.remove('active'));
    
    document.getElementById(buttonId).classList.add('active');
    document.getElementById(panelId).classList.add('active');
}

// Global Content Loader
function loadContent(type, id) {
    const data = database[type][id];
    if (!data) return;

    // Direct string layout modifications
    document.getElementById('displayTitle').innerText = data.title;
    document.getElementById('displayMeta').innerHTML = data.meta;
    document.getElementById('displayBody').innerText = data.bio;

    // Reset game timeline track indicators
    gameEngine.reset();
    board.start();
    moveHistory = data.moves;
    currentMoveIndex = -1;
    updateButtons();
}

// Custom PGN Splicing Matrix
function stepMove(direction) {
    if (direction === 1 && currentMoveIndex < moveHistory.length - 1) {
        currentMoveIndex++;
        gameEngine.move(moveHistory[currentMoveIndex]);
    } else if (direction === -1 && currentMoveIndex >= 0) {
        gameEngine.undo();
        currentMoveIndex--;
    }
    board.position(gameEngine.fen());
    updateButtons();
}

// Toggle Button Disabled states
function updateButtons() {
    document.getElementById('prevBtn').disabled = (currentMoveIndex < 0);
    document.getElementById('nextBtn').disabled = (currentMoveIndex >= moveHistory.length - 1);
}