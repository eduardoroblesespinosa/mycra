import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State and Variables ---
    let activeModule = 'inicio-solar';
    let cameraStream = null;
    let audioContext;
    let shimmerSoundBuffer;
    let diaryProgress = [];

    // --- Audio setup ---
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    async function loadSound(url) {
        if (!audioContext) initAudio();
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            return buffer;
        } catch (error) {
            console.error(`Error loading sound: ${url}`, error);
            return null;
        }
    }
    
    function playSound(buffer) {
        if (!buffer || !audioContext) return;
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    // Load sound on first user interaction
    document.body.addEventListener('click', initAudio, { once: true });
    loadSound('/shimmering-reveal.mp3').then(buffer => shimmerSoundBuffer = buffer);

    // --- Module Navigation ---
    const navLinks = document.querySelectorAll('.nav-link');
    const modules = document.querySelectorAll('.app-module');

    // --- Image Preloading ---
    let auraImage, thirdEyeImage;

    Promise.all([
        loadImage('/asset_name.png'),
        loadImage('/tercer-ojo.png')
    ]).then(([loadedAura, loadedThirdEye]) => {
        auraImage = loadedAura;
        thirdEyeImage = loadedThirdEye;
        // Enable button only when in the correct module or when switching to it.
        if(activeModule === 'reconociendo-imagen') {
             activateEffectsBtn.disabled = false;
             activateEffectsBtn.textContent = 'Activar Filtros Solares';
        }
    }).catch(error => {
        console.error("Error loading images for effects:", error);
        activateEffectsBtn.textContent = 'Error al cargar efectos';
        // Optionally, inform the user more gracefully
    });

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load image ${src}: ${err}`));
            img.src = src;
        });
    }

    function switchModule(targetId) {
        if (activeModule === targetId) return;

        modules.forEach(module => {
            if (module.id === targetId) {
                module.style.display = 'block';
                module.classList.add('active');
            } else {
                module.style.display = 'none';
                module.classList.remove('active');
            }
        });

        navLinks.forEach(link => {
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Stop camera if navigating away from the recognition module
        if (targetId !== 'reconociendo-imagen' && cameraStream) {
            stopWebcam();
        }
        
        // Initialize diary when switching to it
        if (targetId === 'diario-espejo') {
            initDiary();
        }

        activeModule = targetId;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchModule(e.target.dataset.target);
        });
    });

    document.getElementById('ver-reflejo-btn').addEventListener('click', () => {
        switchModule('activacion-reflejo');
    });

    // --- Module 1: Inicio Solar (3D Sun) ---
    const sunContainer = document.getElementById('sun-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, sunContainer.clientWidth / sunContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(sunContainer.clientWidth, sunContainer.clientHeight);
    sunContainer.appendChild(renderer.domElement);

    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xf0c43c, wireframe: false });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Simple Corona/Glow effect
    const coronaGeometry = new THREE.SphereGeometry(1.6, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    scene.add(corona);

    camera.position.z = 5;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;

    function animateSun() {
        requestAnimationFrame(animateSun);
        sun.rotation.y += 0.002;
        corona.scale.x = corona.scale.y = corona.scale.z = 1 + Math.sin(Date.now() * 0.001) * 0.05;
        controls.update();
        renderer.render(scene, camera);
    }
    animateSun();

    window.addEventListener('resize', () => {
        camera.aspect = sunContainer.clientWidth / sunContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(sunContainer.clientWidth, sunContainer.clientHeight);
    });

    // --- Module 2: Activación del Reflejo ---
    const activacionForm = document.getElementById('activacion-form');
    const mantrasContainer = document.getElementById('mantras-container');

    activacionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const heridas = document.getElementById('heridas').value;
        const creencias = document.getElementById('creencias').value;

        const mantras = [];
        if (nombre) mantras.push(`Yo, ${nombre}, soy un ser de luz infinita.`);
        if (heridas) mantras.push('Transformo mis heridas en sabiduría y poder.');
        if (creencias) mantras.push('Libero todas las creencias que no sirven a mi más alto bien.');
        mantras.push('Mi reflejo es el de la perfección divina del Sol.');

        mantrasContainer.innerHTML = '';
        mantras.forEach((mantra, index) => {
            const p = document.createElement('p');
            p.textContent = mantra;
            p.className = 'mantra';
            p.style.animationDelay = `${index * 1}s`;
            mantrasContainer.appendChild(p);
        });
    });

    // --- Module 5: Diario Espejo 21 Días ---
    const diaryCalendar = document.getElementById('diario-calendario');
    const afirmacionContainer = document.getElementById('afirmacion-diaria-container');
    const afirmacionTitulo = document.getElementById('afirmacion-titulo');
    const afirmacionTexto = document.getElementById('afirmacion-texto');
    const completarDiaBtn = document.getElementById('completar-dia-btn');
    let currentDiaryDay = -1;

    const afirmaciones = [
        "Me amo y me acepto completa e incondicionalmente, aquí y ahora.",
        "Cada célula de mi cuerpo vibra con energía, salud y vitalidad.",
        "Soy un imán para la abundancia, la prosperidad y las oportunidades maravillosas.",
        "Libero mi pasado con gratitud y abrazo mi futuro con esperanza.",
        "Confío en mi intuición; es mi brújula interna que me guía hacia mi bien supremo.",
        "Mi creatividad es infinita y se expresa fácilmente a través de mí.",
        "Perdono a todos, incluido a mí mismo, para liberar el peso del resentimiento.",
        "Merezco todo lo bueno que la vida tiene para ofrecer, sin excepciones.",
        "Mi corazón está abierto para dar y recibir amor de forma ilimitada.",
        "Soy fuerte, resiliente y capaz de superar cualquier desafío que se presente.",
        "Atraigo relaciones sanas, amorosas y que me apoyan en mi crecimiento.",
        "Agradezco por las bendiciones en mi vida y por las que están por llegar.",
        "Mi voz es valiosa y mis opiniones merecen ser escuchadas con respeto.",
        "Tomo decisiones alineadas con mi alma y mi propósito de vida.",
        "El universo conspira a mi favor para que logre mis sueños más profundos.",
        "Mi paz interior es mi prioridad y la cultivo cada día con mis pensamientos.",
        "Soy el arquitecto de mi realidad y construyo una vida llena de alegría y significado.",
        "Reconozco y honro la luz divina que reside dentro de mí.",
        "Cada día es una nueva oportunidad para ser mi mejor versión.",
        "Mi energía positiva transforma mi entorno y eleva a quienes me rodean.",
        "Estoy completo, soy suficiente y mi existencia es un regalo para el mundo."
    ];

    function loadDiaryProgress() {
        const progress = localStorage.getItem('diarioEspejoProgress');
        diaryProgress = progress ? JSON.parse(progress) : Array(21).fill(false);
    }

    function saveDiaryProgress() {
        localStorage.setItem('diarioEspejoProgress', JSON.stringify(diaryProgress));
    }

    function renderDiary() {
        diaryCalendar.innerHTML = '';
        const nextUncompletedDay = diaryProgress.indexOf(false);

        for (let i = 0; i < 21; i++) {
            const dayCard = document.createElement('div');
            dayCard.classList.add('day-card');
            dayCard.dataset.day = i;
            dayCard.innerHTML = `<span>Día ${i + 1}</span>${i + 1}`;

            if (diaryProgress[i]) {
                dayCard.classList.add('completed');
            } else if (i === nextUncompletedDay) {
                dayCard.classList.add('current');
            } else {
                dayCard.classList.add('locked');
            }
            diaryCalendar.appendChild(dayCard);

            dayCard.addEventListener('click', () => handleDayClick(i));
        }
    }
    
    function handleDayClick(dayIndex) {
        const isCompleted = diaryProgress[dayIndex];
        const isCurrent = dayIndex === diaryProgress.indexOf(false);
        
        if (!isCompleted && !isCurrent) {
            afirmacionContainer.style.display = 'none';
            return; // It's a locked day
        }

        currentDiaryDay = dayIndex;
        afirmacionTitulo.textContent = `Afirmación del Día ${dayIndex + 1}`;
        afirmacionTexto.textContent = `"${afirmaciones[dayIndex]}"`;
        completarDiaBtn.style.display = isCompleted ? 'none' : 'block';
        afirmacionContainer.style.display = 'block';
    }

    completarDiaBtn.addEventListener('click', () => {
        if (currentDiaryDay !== -1 && !diaryProgress[currentDiaryDay]) {
            diaryProgress[currentDiaryDay] = true;
            saveDiaryProgress();
            renderDiary();
            playSound(shimmerSoundBuffer);
            afirmacionContainer.style.display = 'none'; // Hide after completion
            currentDiaryDay = -1;
        }
    });

    function initDiary() {
        loadDiaryProgress();
        renderDiary();
        afirmacionContainer.style.display = 'none';
    }

    // --- Module 4: Reconstrucción de Identidad ---
    const reconstruccionForm = document.getElementById('reconstruccion-form');
    const simboloContainer = document.getElementById('simbolo-container');

    reconstruccionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get data from the form
        const quienFui = document.getElementById('quien-fui').value;
        const quienRompio = document.getElementById('quien-rompio').value;
        const quienSoy = document.getElementById('quien-soy').value;
        
        // Save data to localStorage
        localStorage.setItem('reconstruccionIdentidad', JSON.stringify({ quienFui, quienRompio, quienSoy }));

        // Get name, fallback to a default
        const nombre = document.getElementById('nombre').value || 'Ser de Luz';

        // Generate symbol and mantra
        const simbolos = ['✧', '✦', '☼', '❂', '✨'];
        const simbolo = simbolos[Math.floor(Math.random() * simbolos.length)];
        const mantra = `Yo, ${nombre}, transmuto mi pasado. Desde la esencia de '${quienSoy.split(' ')[0]}', forjo mi nuevo símbolo de poder.`;

        // Display the result
        simboloContainer.innerHTML = `
            <div id="simbolo-display">${simbolo}</div>
            <p id="simbolo-texto">${mantra}</p>
        `;

        // Make it visible with a transition and play sound
        simboloContainer.classList.add('visible');
        playSound(shimmerSoundBuffer);
    });

    // --- Module 3: Reconocimiento de Imagen ---
    const webcamVideo = document.getElementById('webcam');
    const effectsCanvas = document.getElementById('effects-canvas');
    const activateEffectsBtn = document.getElementById('activate-effects-btn');
    const ctx = effectsCanvas.getContext('2d');

    async function startWebcam() {
        if (cameraStream) return;
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            webcamVideo.srcObject = cameraStream;
            webcamVideo.onloadedmetadata = () => {
                effectsCanvas.width = webcamVideo.videoWidth;
                effectsCanvas.height = webcamVideo.videoHeight;
                // Button state is handled by image preloader
            };
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("No se pudo acceder a la cámara. Por favor, otorga los permisos necesarios.");
        }
    }

    function stopWebcam() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
            ctx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
        }
    }
    
    function drawEffects() {
        if (!cameraStream || !auraImage || !thirdEyeImage) return;
        
        const w = effectsCanvas.width;
        const h = effectsCanvas.height;

        ctx.clearRect(0, 0, w, h);
        
        // Draw video frame onto canvas (optional, for static image capture)
        // ctx.drawImage(webcamVideo, 0, 0, w, h);

        // --- Draw Solar Filter ---
        ctx.globalCompositeOperation = 'overlay';
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8);
        gradient.addColorStop(0, 'rgba(255, 230, 150, 0.1)');
        gradient.addColorStop(1, 'rgba(240, 196, 60, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';


        // --- Draw Aura ---
        const auraSize = w * 0.8;
        const auraX = (w - auraSize) / 2;
        const auraY = (h / 2) - (auraSize / 1.5);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(auraImage, auraX, auraY, auraSize, auraSize);
        ctx.globalAlpha = 1.0;

        // --- Draw Third Eye ---
        const thirdEyeWidth = w * 0.15;
        const thirdEyeHeight = thirdEyeImage.height / thirdEyeImage.width * thirdEyeWidth;
        const thirdEyeX = (w - thirdEyeWidth) / 2;
        const thirdEyeY = h / 2 - h * 0.25;
        ctx.drawImage(thirdEyeImage, thirdEyeX, thirdEyeY, thirdEyeWidth, thirdEyeHeight);

        requestAnimationFrame(drawEffects);
    }
    
    activateEffectsBtn.addEventListener('click', () => {
        if (activateEffectsBtn.disabled) return;

        if (!cameraStream) {
            startWebcam().then(() => {
                // Check if webcam started successfully
                if (cameraStream) {
                    activateEffectsBtn.textContent = 'Desactivar Efectos';
                    drawEffects();
                }
            });
        } else {
             // Simple toggle logic
             stopWebcam();
             activateEffectsBtn.textContent = 'Activar Filtros Solares';
        }
    });

    // Adjust button state when switching modules
    const observer = new MutationObserver((mutationsList) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'reconociendo-imagen' && target.classList.contains('active')) {
                     // If images are loaded, enable the button.
                    if (auraImage && thirdEyeImage) {
                         activateEffectsBtn.disabled = false;
                         activateEffectsBtn.textContent = 'Activar Filtros Solares';
                    }
                }
            }
        }
    });

    const recognitionModule = document.getElementById('reconociendo-imagen');
    if(recognitionModule) {
        observer.observe(recognitionModule, { attributes: true });
    }
});