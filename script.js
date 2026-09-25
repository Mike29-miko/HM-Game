// Updated Dataset strictly matching requested titles
// NOTE: replace these with your local files once downloaded, e.g. 'images/game-over.png'
const fullRoster = [
    { id: 'game-over', name: 'SYSTEM GAME OVER', img: 'images/game-over.jpg' },
    { id: 'booking-duel', name: 'DOUBLE BOOKING DUEL', img: 'images/booking-duel.jpg' },
    { id: 'room-mismatch', name: 'ROOM MISMATCH', img: 'images/room-mismatch.jpg' },
    { id: 'missing-save', name: 'MISSING SAVE FILE', img: 'images/missing-save.jpg' },
    { id: 'final-boss', name: 'FINAL BOSS', img: 'images/final-boss.jpg' }
];

let availablePool = [...fullRoster];
let currentRound = 1;
let isSpinning = false;

const startBtn = document.getElementById('start-btn');
const stageImg = document.getElementById('stage-img');
const stageName = document.getElementById('stage-name');
const roundNumEl = document.getElementById('round-num');
const poolCountEl = document.getElementById('pool-count');
const rosterGrid = document.getElementById('roster-grid');
const characterCard = document.querySelector('.character-card');
const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
const flashOverlay = document.getElementById('flash-overlay');

let musicPlaying = false;

function playMusic() {
    if (musicPlaying) return;
    bgMusic.play().catch((err) => console.log('Playback blocked:', err));
    musicToggle.textContent = '🔊 Music';
    musicToggle.classList.add('playing');
    musicPlaying = true;
}

function pauseMusic() {
    bgMusic.pause();
    musicToggle.textContent = '🔇 Music';
    musicToggle.classList.remove('playing');
    musicPlaying = false;
}

musicToggle.addEventListener('click', () => {
    if (musicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
});

function renderGrid() {
    rosterGrid.innerHTML = '';
    fullRoster.forEach(char => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.id = `grid-${char.id}`;

        const isAvailable = availablePool.some(p => p.id === char.id);
        if (!isAvailable) {
            item.classList.add('excluded');
        }

        item.innerHTML = `
            <img src="${char.img}" alt="${char.name}">
            <div class="name">${char.name}</div>
        `;
        rosterGrid.appendChild(item);
    });
}

function runRandomizer() {
    if (isSpinning) return;

    playMusic();

    if (availablePool.length === 0) {
        resetRoster();
        return;
    }

    isSpinning = true;
    startBtn.disabled = true;
    characterCard.classList.add('spinning');

    let counter = 0;
    const totalDuration = 2200;
    const intervalTime = 90;
    const steps = totalDuration / intervalTime;

    const spinInterval = setInterval(() => {
        const tempIndex = Math.floor(Math.random() * availablePool.length);
        const tempChar = availablePool[tempIndex];

        stageImg.src = tempChar.img;
        stageName.textContent = tempChar.name;

        document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('active-highlight'));
        const activeGridItem = document.getElementById(`grid-${tempChar.id}`);
        if (activeGridItem) activeGridItem.classList.add('active-highlight');

        counter++;

        if (counter >= steps) {
            clearInterval(spinInterval);
            finalizeSelection(tempChar);
        }
    }, intervalTime);
}

function finalizeSelection(selectedChar) {
    characterCard.classList.remove('spinning');
    characterCard.classList.remove('impact');
    // force reflow so the animation can retrigger on repeated selections
    void characterCard.offsetWidth;
    characterCard.classList.add('impact');

    // --- drama effects on every landed result ---
    triggerShake();
    triggerFlash();
    launchConfetti();

    availablePool = availablePool.filter(char => char.id !== selectedChar.id);

    const selectedGridItem = document.getElementById(`grid-${selectedChar.id}`);
    if (selectedGridItem) {
        selectedGridItem.classList.remove('active-highlight');
        selectedGridItem.classList.add('excluded');
    }

    poolCountEl.textContent = availablePool.length;

    if (availablePool.length > 0) {
        currentRound++;
        roundNumEl.textContent = currentRound;
        startBtn.textContent = 'Next Selection';
    } else {
        roundNumEl.textContent = 'COMPLETE';
        startBtn.textContent = 'Reset System';
        stageName.textContent = `${selectedChar.name} (ROUND COMPLETE)`;
        launchConfetti(140); // bigger burst on the final pick
    }

    isSpinning = false;
    startBtn.disabled = false;
}

function resetRoster() {
    characterCard.classList.remove('spinning', 'impact');
    availablePool = [...fullRoster];
    currentRound = 1;
    roundNumEl.textContent = currentRound;
    poolCountEl.textContent = availablePool.length;
    startBtn.textContent = 'Start Selection';
    stageImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='130' height='130' viewBox='0 0 130 130'><rect width='100%' height='100%' fill='%2316181f'/><text x='50%' y='55%' font-size='40' fill='%238a8d9b' text-anchor='middle' dominant-baseline='middle'>?</text></svg>";
    stageName.textContent = 'PRESS START';
    renderGrid();
}

function triggerShake() {
    document.body.classList.remove('shake');
    void document.body.offsetWidth; // force reflow so it can retrigger
    document.body.classList.add('shake');
}

function triggerFlash() {
    if (!flashOverlay) return;
    flashOverlay.classList.remove('flash-active');
    void flashOverlay.offsetWidth; // force reflow so it can retrigger
    flashOverlay.classList.add('flash-active');
}

function launchConfetti(count = 60) {
    const layer = document.getElementById('confetti-layer');
    if (!layer) return; // guard: div missing from HTML
    const colors = ['#f39c12', '#e74c3c', '#ffffff', '#ff4b2b'];
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        piece.style.setProperty('--rot', `${Math.random() * 360}deg`);
        layer.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
    }
}

startBtn.addEventListener('click', runRandomizer);
renderGrid();

// --- Register service worker for offline support ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('sw.js')
            .then(() => console.log('Service worker registered'))
            .catch((err) => console.log('Service worker registration failed:', err));
    });
}