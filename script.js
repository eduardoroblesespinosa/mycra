import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let credits = 100;
    let tokens = 0;
    let level = 1;
    let selectedRacer = null;
    let raceInProgress = false;

    const BET_COST = 20;
    const TOKENS_PER_WIN = 50;
    const TOKENS_PER_LEVEL = 100;

    // DOM Elements
    const creditsDisplay = document.getElementById('credits-display');
    const tokensDisplay = document.getElementById('tokens-display');
    const levelDisplay = document.getElementById('level-display');
    const betBtn = document.getElementById('bet-btn');
    const racersContainer = document.getElementById('racers-container');
    const raceTrackContainer = document.getElementById('race-track-container');
    const selectionArea = document.getElementById('selection-area');
    const rechargeBtn = document.getElementById('recharge-btn');
    const creditPacksContainer = document.getElementById('credit-packs');

    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    const resultMessage = document.getElementById('result-message');
    const resultDetails = document.getElementById('result-details');
    
    const paypalModal = new bootstrap.Modal(document.getElementById('paypalModal'));
    const lowCreditsModal = new bootstrap.Modal(document.getElementById('lowCreditsModal'));
    const levelUpModal = new bootstrap.Modal(document.getElementById('levelUpModal'));
    const levelUpDetails = document.getElementById('level-up-details');
    const rechargeFromModalBtn = document.getElementById('recharge-from-modal-btn');
    
    // Audio Context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let winSoundBuffer, loseSoundBuffer, startSoundBuffer;

    // --- Sound Loading ---
    async function loadSound(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound: ${url}`, error);
        }
    }

    async function setupSounds() {
        winSoundBuffer = await loadSound('race_win.mp3');
        loseSoundBuffer = await loadSound('race_lose.mp3');
        startSoundBuffer = await loadSound('race_start.mp3');
    }

    function playSound(buffer) {
        if (!buffer || audioContext.state === 'suspended') return;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
    
    // --- Racers Data ---
    const racers = [
        { id: 'griffin', name: 'Griffin', img: 'griffin.png' },
        { id: 'dragon', name: 'Dragon', img: 'dragon.png' },
        { id: 'phoenix', name: 'Phoenix', img: 'phoenix.png' },
        { id: 'unicorn', name: 'Unicorn', img: 'unicorn.png' },
        { id: 'hydra', name: 'Hydra', img: 'hydra.png' },
    ];
    
    const creditPacks = [
        { credits: 50,  cost: '0.99', sku: 'CREDIT_PACK_50' },
        { credits: 120, cost: '1.99', sku: 'CREDIT_PACK_120' },
        { credits: 300, cost: '4.99', sku: 'CREDIT_PACK_300' }
    ];

    // --- Initialization ---
    function init() {
        renderRacerSelection();
        renderCreditPacks();
        updateUI();
        setupSounds();
        setupPayPalButtons();

        // Event Listeners
        betBtn.addEventListener('click', handleBet);
        rechargeBtn.addEventListener('click', () => paypalModal.show());
        rechargeFromModalBtn.addEventListener('click', () => {
            lowCreditsModal.hide();
            paypalModal.show();
        });

        // Resume audio context on first user gesture
        document.body.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    }

    // --- UI Rendering ---
    function renderRacerSelection() {
        racersContainer.innerHTML = '';
        racers.forEach(racer => {
            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <div class="card bg-dark text-white text-center racer-card" data-id="${racer.id}">
                    <img src="${racer.img}" class="card-img-top p-2" alt="${racer.name}">
                    <div class="card-body py-2">
                        <h5 class="card-title">${racer.name}</h5>
                    </div>
                </div>
            `;
            racersContainer.appendChild(col);
        });

        document.querySelectorAll('.racer-card').forEach(card => {
            card.addEventListener('click', () => selectRacer(card.dataset.id));
        });
    }

    function renderCreditPacks() {
        creditPacksContainer.innerHTML = '';
        creditPacks.forEach((pack, index) => {
            const checked = index === 0 ? 'checked' : '';
            creditPacksContainer.innerHTML += `
                <input type="radio" class="btn-check" name="credit-pack-options" id="pack-${pack.sku}" value="${pack.sku}" autocomplete="off" ${checked}>
                <label class="btn btn-outline-warning" for="pack-${pack.sku}">${pack.credits} Credits for $${pack.cost}</label>
            `;
        });
    }

    function updateUI() {
        creditsDisplay.textContent = credits;
        tokensDisplay.textContent = tokens;
        levelDisplay.textContent = level;
        betBtn.disabled = !selectedRacer || credits < BET_COST || raceInProgress;
        betBtn.textContent = `Place Bet (${BET_COST} Credits)`;
        
        if (credits < BET_COST) {
            betBtn.classList.add('btn-danger');
            betBtn.textContent = 'Not Enough Credits';
        } else {
            betBtn.classList.remove('btn-danger');
        }
    }

    // --- Game Logic ---
    function selectRacer(racerId) {
        if (raceInProgress) return;
        
        selectedRacer = racerId;
        
        document.querySelectorAll('.racer-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.id === racerId) {
                card.classList.add('selected');
            }
        });

        updateUI();
    }
    
    function handleBet() {
        if (!selectedRacer || credits < BET_COST || raceInProgress) {
            return;
        }

        credits -= BET_COST;
        raceInProgress = true;
        
        // Check for low credits to show persuasive modal
        if (credits <= BET_COST && !sessionStorage.getItem('lowCreditsModalShown')) {
            lowCreditsModal.show();
            sessionStorage.setItem('lowCreditsModalShown', 'true');
        }

        updateUI();
        toggleUI(false);
        startRace();
    }

    function startRace() {
        playSound(startSoundBuffer);
        raceTrackContainer.innerHTML = '<div class="finish-line"></div>'; // Clear previous racers and keep finish line
        const trackWidth = raceTrackContainer.clientWidth;
        const finishLine = trackWidth - 100; // 80px racer width + 20px padding

        const animalElements = racers.map((racer, index) => {
            const el = document.createElement('img');
            el.src = racer.img;
            el.className = 'animal-racer';
            el.dataset.id = racer.id;
            el.style.top = `${20 + index * (400 - 80) / racers.length}px`; // Distribute vertically
            raceTrackContainer.appendChild(el);
            return { element: el, position: 10 };
        });

        let winner = null;
        const raceInterval = setInterval(() => {
            for (const animal of animalElements) {
                const move = Math.random() * 5 + 1; // Move between 1 and 6 pixels
                animal.position += move;
                animal.element.style.left = `${animal.position}px`;

                if (animal.position >= finishLine) {
                    winner = animal.element.dataset.id;
                    clearInterval(raceInterval);
                    endRace(winner);
                    break;
                }
            }
        }, 1000 / 60); // 60 FPS
    }


    function endRace(winnerId) {
        const winnerInfo = racers.find(r => r.id === winnerId);
        if (winnerId === selectedRacer) {
            // Win
            playSound(winSoundBuffer);
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            tokens += TOKENS_PER_WIN;
            resultMessage.textContent = 'You Won!';
            resultDetails.textContent = `${winnerInfo.name} won the race! You earned ${TOKENS_PER_WIN} tokens.`;
            checkLevelUp();
        } else {
            // Lose
            playSound(loseSoundBuffer);
            resultMessage.textContent = 'You Lost!';
            resultDetails.textContent = `${winnerInfo.name} was the winner. Better luck next time!`;
        }

        resultModal.show();
        raceInProgress = false;
        toggleUI(true);
        updateUI();
    }
    
    function checkLevelUp() {
        if (tokens >= TOKENS_PER_LEVEL) {
            tokens -= TOKENS_PER_LEVEL;
            level++;
            levelUpDetails.textContent = `You are now Level ${level}! Keep up the great work!`;
            levelUpModal.show();
        }
    }
    
    function toggleUI(enable) {
        betBtn.disabled = !enable || !selectedRacer || credits < BET_COST;
        selectionArea.style.pointerEvents = enable ? 'auto' : 'none';
        selectionArea.style.opacity = enable ? '1' : '0.5';
        rechargeBtn.disabled = !enable;
    }

    function handleAddCredits() {
        credits += 100;
        paypalModal.hide();
        updateUI();
    }

    function setupPayPalButtons() {
        paypal.Buttons({
            createOrder: function(data, actions) {
                const selectedSku = document.querySelector('input[name="credit-pack-options"]:checked').value;
                const selectedPack = creditPacks.find(p => p.sku === selectedSku);

                return actions.order.create({
                    purchase_units: [{
                        description: `Purchase of ${selectedPack.credits} virtual credits`,
                        amount: {
                            value: selectedPack.cost
                        },
                        sku: selectedPack.sku
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    const purchasedSku = details.purchase_units[0].sku;
                    const purchasedPack = creditPacks.find(p => p.sku === purchasedSku);
                    if (purchasedPack) {
                        credits += purchasedPack.credits;
                        paypalModal.hide();
                        updateUI();
                        alert(`Transaction completed! ${purchasedPack.credits} credits have been added to your account.`);
                    }
                });
            },
            onError: function(err) {
                console.error('An error occurred with the PayPal button:', err);
                alert('An error occurred during the transaction. Please try again.');
            }
        }).render('#paypal-button-container');
    }


    // Start the app
    init();
});