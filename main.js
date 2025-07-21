import confetti from 'canvas-confetti';

// --- GAME STATE ---
let state = {
    credits: 100,
    tokens: 0,
    level: 1,
    gameInProgress: false,
};

// --- CONSTANTS ---
const COST_TO_PLAY = 20;
const CARDS_COUNT = 52;
const PRIZE_CARDS_COUNT = 10; // Regular prize (50 tokens)
const SUPER_PRIZE_CARDS_COUNT = 2; // Super prize (250 tokens)
const CREDIT_PRIZE_CARDS_COUNT = 5; // Credit prize (50 credits)
const PENALTY_CARDS_COUNT = 10;
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000]; // Tokens needed for levels 1, 2, 3, 4, 5

// --- DOM ELEMENTS ---
const elements = {
    creditsDisplay: document.getElementById('credits-display'),
    tokensDisplay: document.getElementById('tokens-display'),
    levelDisplay: document.getElementById('level-display'),
    levelProgress: document.getElementById('level-progress'),
    cardGrid: document.getElementById('card-grid'),
    playButton: document.getElementById('play-button'),
    playOverlay: document.getElementById('play-overlay'),
    resultModal: new bootstrap.Modal(document.getElementById('resultModal')),
    resultText: document.getElementById('result-text'),
    resultIcon: document.getElementById('result-icon'),
};

// --- AUDIO ---
const sounds = {
    win: new Audio('win-sound.mp3'),
    lose: new Audio('lose-sound.mp3'),
    flip: new Audio('flip-sound.mp3')
};

// --- GAME LOGIC ---

/**
 * Creates the initial deck of cards with prizes, penalties, and neutral cards.
 * @returns {Array<Object>} An array of card objects.
 */
function createDeck() {
    const deck = [];
    // Super Prizes
    for (let i = 0; i < SUPER_PRIZE_CARDS_COUNT; i++) {
        deck.push({ type: 'super-prize', value: 250 }); // Win 250 tokens
    }
    // Credit Prizes
    for (let i = 0; i < CREDIT_PRIZE_CARDS_COUNT; i++) {
        deck.push({ type: 'credit-prize', value: 50 }); // Win 50 credits
    }
    // Regular Prizes
    for (let i = 0; i < PRIZE_CARDS_COUNT; i++) {
        deck.push({ type: 'prize', value: 50 }); // Win 50 tokens
    }
    // Penalties
    for (let i = 0; i < PENALTY_CARDS_COUNT; i++) {
        deck.push({ type: 'penalty', value: 10 }); // Lose 10 credits
    }

    // Neutral cards
    const specialCardsCount = deck.length;
    for (let i = 0; i < CARDS_COUNT - specialCardsCount; i++) {
        deck.push({ type: 'neutral' });
    }

    return shuffle(deck);
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Renders the card elements in the DOM.
 * @param {Array<Object>} deck The deck of cards to render.
 */
function renderCards(deck) {
    elements.cardGrid.innerHTML = '';
    deck.forEach((cardData, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card disabled';
        cardEl.dataset.index = index;

        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        cardBack.innerHTML = `<img src="card-back.png" alt="Card Back">`;
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-face card-front';
        
        let iconSrc = '';
        if(cardData.type === 'prize') iconSrc = 'prize-icon.png';
        if(cardData.type === 'super-prize') iconSrc = 'super-prize-icon.png';
        if(cardData.type === 'credit-prize') iconSrc = 'credit-prize-icon.png';
        if(cardData.type === 'penalty') iconSrc = 'penalty-icon.png';
        if(iconSrc) cardFront.innerHTML = `<img src="${iconSrc}" alt="${cardData.type}">`;

        cardEl.appendChild(cardBack);
        cardEl.appendChild(cardFront);
        
        cardEl.addEventListener('click', () => handleCardClick(cardEl, cardData));
        elements.cardGrid.appendChild(cardEl);
    });
}

/**
 * Handles the logic when a user clicks a card.
 * @param {HTMLElement} cardEl The card element that was clicked.
 * @param {Object} cardData The data associated with the clicked card.
 */
function handleCardClick(cardEl, cardData) {
    if (!state.gameInProgress || cardEl.classList.contains('flipped')) return;

    state.gameInProgress = false;
    sounds.flip.play();
    cardEl.classList.add('flipped');

    let resultText = "Nada especial... Inténtalo de nuevo.";
    let resultIconSrc = '';
    
    if (cardData.type === 'prize') {
        state.tokens += cardData.value;
        resultText = `¡Has ganado ${cardData.value} tokens!`;
        resultIconSrc = 'prize-icon.png';
        sounds.win.play();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (cardData.type === 'super-prize') {
        state.tokens += cardData.value;
        resultText = `¡PREMIO MAYOR! ¡Has ganado ${cardData.value} tokens!`;
        resultIconSrc = 'super-prize-icon.png';
        sounds.win.play();
        confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 }, scalar: 1.2 });
    } else if (cardData.type === 'credit-prize') {
        state.credits += cardData.value;
        resultText = `¡Genial! ¡Recuperas ${cardData.value} créditos!`;
        resultIconSrc = 'credit-prize-icon.png';
        sounds.win.play();
    } else if (cardData.type === 'penalty') {
        state.credits -= cardData.value;
        resultText = `¡Oh no! Pierdes ${cardData.value} créditos.`;
        resultIconSrc = 'penalty-icon.png';
        sounds.lose.play();
    }
    
    setTimeout(() => {
        showResultModal(resultText, resultIconSrc);
        updateUI();
        elements.playOverlay.classList.remove('hidden');
    }, 1000); // Wait for flip animation
}

/**
 * Starts a new game round.
 */
function startGame() {
    if (state.credits < COST_TO_PLAY) {
        alert("No tienes suficientes créditos para jugar.");
        return;
    }
    state.credits -= COST_TO_PLAY;
    state.gameInProgress = true;
    
    const deck = createDeck();
    renderCards(deck); // Re-render shuffled cards
    
    // Enable cards for selection
    document.querySelectorAll('.card').forEach(c => c.classList.remove('disabled'));

    elements.playOverlay.classList.add('hidden');
    updateUI();
}

// --- UI & UPDATES ---

/**
 * Updates all displayed stats on the page.
 */
function updateUI() {
    elements.creditsDisplay.textContent = state.credits;
    elements.tokensDisplay.textContent = state.tokens;
    updateLevel();
    elements.playButton.disabled = state.credits < COST_TO_PLAY;
}

/**
 * Checks and updates the player's level based on tokens.
 */
function updateLevel() {
    const currentLevelThreshold = LEVEL_THRESHOLDS[state.level - 1];
    const nextLevelThreshold = LEVEL_THRESHOLDS[state.level] || currentLevelThreshold;
    
    if (state.tokens >= nextLevelThreshold && state.level < LEVEL_THRESHOLDS.length -1) {
        state.level++;
    }

    const progressForCurrentLevel = state.tokens - currentLevelThreshold;
    const progressNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
    const progressPercentage = (progressForCurrentLevel / progressNeededForNextLevel) * 100;
    
    elements.levelDisplay.textContent = state.level;
    elements.levelProgress.style.width = `${Math.min(progressPercentage, 100)}%`;
    elements.levelProgress.setAttribute('aria-valuenow', progressPercentage);
}

/**
 * Shows the result modal with a message and icon.
 * @param {string} text The message to display.
 * @param {string} iconSrc The source for the result icon.
 */
function showResultModal(text, iconSrc) {
    elements.resultText.textContent = text;
    elements.resultIcon.src = iconSrc;
    elements.resultIcon.style.display = iconSrc ? 'inline-block' : 'none';
    elements.resultModal.show();
}

/**
 * Adds credits to the player's state.
 * @param {number} amount The number of credits to add.
 */
function addCredits(amount) {
    state.credits += amount;
    updateUI();
    alert(`${amount} créditos han sido añadidos a tu cuenta.`);
}

// --- PAYPAL INTEGRATION (SIMULATED) ---
paypal.Buttons({
    createOrder: function(data, actions) {
        // For simplicity, we create a fixed-value order on the client.
        // In a real app, this would be generated by a server call.
        return actions.order.create({
            purchase_units: [{
                description: 'Paquete de 1000 créditos para Cartas Mágicas',
                amount: {
                    value: '5.00' // Example price
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        // This function is called when the payment is approved by the user.
        return actions.order.capture().then(function(details) {
            // This is where the credits are added in our simulation.
            // In a real app, you would verify the transaction on your server before adding credits.
            console.log('Transaction completed by ' + details.payer.name.given_name);
            addCredits(1000); 
        });
    }
}).render('#paypal-button-container');


// --- INITIALIZATION ---
function init() {
    elements.playButton.addEventListener('click', startGame);
    updateUI();
    // Render an initial set of disabled cards
    renderCards(new Array(CARDS_COUNT).fill({ type: 'disabled' }));
}

init();