    /* ===================================================================
       画面サイズ対応：常に1100x520の固定レイアウトを拡大縮小するだけにする
    =================================================================== */
    function fitGame() {
        const container = document.getElementById('game-container');
        const scale = Math.min(window.innerWidth / 1100, window.innerHeight / 520);
        container.style.transform = 'scale(' + scale + ')';
    }
    window.addEventListener('resize', fitGame);
    window.addEventListener('orientationchange', fitGame);
    fitGame();

    /* ===================================================================
       サウンド関連
    =================================================================== */
    let soundOn = true;

    const mapBgm = new Audio(encodeURI('Sounds/勇敢な者たち.mp3'));
    mapBgm.loop = true;
    mapBgm.volume = 0.35;

    const battleBgm = new Audio(encodeURI('Sounds/bgm.mp3'));
    battleBgm.loop = true;
    battleBgm.volume = 0.35;

    const sfx = {
        select: new Audio(encodeURI('Sounds/セレクト音風な効果音.mp3')),
        decide: new Audio(encodeURI('Sounds/システム決定音_9.mp3')),
        correct: new Audio(encodeURI('Sounds/ゲームクリアー！.mp3')),
        wrong: new Audio(encodeURI('Sounds/爆破・爆発音.mp3')),
        hit: new Audio(encodeURI('Sounds/打撃音.mp3'))
    };
    const sfxDefaultVolume = { select: 0.7, decide: 0.7, correct: 0.7, wrong: 0.7, hit: 0.7 };
    for (const key in sfx) {
        sfx[key].volume = sfxDefaultVolume[key];
    }

    const sfxTimers = {};
    const sfxFadeIntervals = {};

    function playSfx(name) {
        if (!soundOn) return;
        const base = sfx[name];
        if (!base) return;

        if (sfxTimers[name]) { clearTimeout(sfxTimers[name]); sfxTimers[name] = null; }
        if (sfxFadeIntervals[name]) { clearInterval(sfxFadeIntervals[name]); sfxFadeIntervals[name] = null; }

        base.currentTime = 0;
        base.volume = sfxDefaultVolume[name] ?? 0.7;
        base.play().catch(() => {});

        // 再生開始4秒後からフェードアウトし、5秒でぴったり停止
        const fadeStartMs = 4000;
        const fadeDurationMs = 1000;
        const fadeSteps = 20;
        const stepTime = fadeDurationMs / fadeSteps;

        sfxTimers[name] = setTimeout(() => {
            let step = 0;
            const startVolume = base.volume;
            sfxFadeIntervals[name] = setInterval(() => {
                step++;
                base.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
                if (step >= fadeSteps) {
                    clearInterval(sfxFadeIntervals[name]);
                    sfxFadeIntervals[name] = null;
                    base.pause();
                    base.currentTime = 0;
                    base.volume = sfxDefaultVolume[name] ?? 0.7;
                }
            }, stepTime);
        }, fadeStartMs);
    }

    function playBgm(which) {
        if (!soundOn) return;
        mapBgm.pause();
        battleBgm.pause();
        if (which === 'map') mapBgm.play().catch(() => {});
        if (which === 'battle') battleBgm.play().catch(() => {});
    }
    function stopAllBgm() {
        mapBgm.pause();
        battleBgm.pause();
    }

    function toggleSound() {
        soundOn = !soundOn;
        document.getElementById('sound-toggle').innerText = soundOn ? '🔊' : '🔇';
        if (!soundOn) {
            stopAllBgm();
        } else {
            if (currentScreen === 'map') playBgm('map');
            if (currentScreen === 'battle') playBgm('battle');
        }
    }

    /* ===================================================================
       ゲームデータ
    =================================================================== */
    const STAGES = [
        { id: 1, bg: 'Images/stage/map01_メタバース空間.png' },
        { id: 2, bg: 'Images/stage/map02_森.png' },
        { id: 3, bg: 'Images/stage/map03_街.png' },
        { id: 4, bg: 'Images/stage/map04_車両基地.png' },
        { id: 5, bg: 'Images/stage/map05_月.png' },
        { id: 6, bg: 'Images/stage/map06_アジト.png' }
    ];

    // バトルポイントの座標（%指定）。実際のマップ画像に合わせて自由に調整してください。
    const NODE_POSITIONS = [
        { x: 18, y: 72 },
        { x: 32, y: 42 },
        { x: 50, y: 68 },
        { x: 68, y: 40 },
        { x: 82, y: 65 },
        { x: 50, y: 18 } // ボス
    ];

    const CHARACTERS = [
        { id: 'e5hayabusa', name: 'E5 はやぶさ', img: 'Images/CW/e5hayabusa.png' },
        { id: 'e6komachi', name: 'E6 こまち', img: 'Images/CW/e6komachi.png' },
        { id: 'e7kagayaki', name: 'E7 かがやき', img: 'Images/CW/e7kagayaki.png' }
    ];

    // ボス以外の敵はこの中からランダムに使用
    const NORMAL_ENEMY_IMAGES = [
        'Images/CW/敵1.png',
        'Images/CW/敵2.png',
        'Images/CW/敵3.png',
        'Images/CW/敵4.png'
    ];

    const SAVE_KEY = 'shinkalion_clock_master_save_v1';

    function loadProgress() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            unlockedStage: 1,
            stageProgress: {},
            selectedCharacter: 'e5hayabusa',
            visitedStages: {}
        };
    }
    function saveProgress() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (e) {}
    }
    function getStageClears(stageId) {
        if (!progress.stageProgress[stageId]) {
            progress.stageProgress[stageId] = [false, false, false, false, false, false];
        }
        return progress.stageProgress[stageId];
    }

    let progress = loadProgress();
    if (!progress.visitedStages) progress.visitedStages = {};
    let currentScreen = 'top';
    let currentStageId = progress.unlockedStage;
    let pendingNodeIndex = null;

    /* ===================================================================
       画面切り替え
    =================================================================== */
    function showScreen(name) {
        document.getElementById('screen-top').style.display = name === 'top' ? 'flex' : 'none';
        document.getElementById('screen-map').style.display = name === 'map' ? 'block' : 'none';
        document.getElementById('screen-battle').style.display = name === 'battle' ? 'block' : 'none';
        document.getElementById('menu-btn').style.display = name === 'map' ? 'block' : 'none';
        currentScreen = name;
    }

    function startGame() {
        playSfx('decide');
        showScreen('map');
        playBgm('map');
        renderMap();
        // STARTから飛んだときは常に演出を表示
        playStageIntro(currentStageId);
        progress.visitedStages[currentStageId] = true;
        saveProgress();
    }

    // 初めて訪れるステージのときだけ演出を表示
    function maybeShowStageIntro() {
        if (!progress.visitedStages[currentStageId]) {
            playStageIntro(currentStageId);
            progress.visitedStages[currentStageId] = true;
            saveProgress();
        }
    }

    /* ===================================================================
       マップ画面
    =================================================================== */
    function playStageIntro(stageId) {
        const intro = document.getElementById('stage-intro');
        const text = document.getElementById('stage-intro-text');
        text.innerText = 'ステージ ' + stageId;
        intro.classList.remove('show');
        void intro.offsetWidth;
        intro.classList.add('show');
    }

    function showMapToast(text) {
        const t = document.getElementById('map-toast');
        t.innerText = text;
        t.style.display = 'block';
        clearTimeout(t._hideTimer);
        t._hideTimer = setTimeout(() => { t.style.display = 'none'; }, 1800);
    }

    function renderMap() {
        const stage = STAGES[currentStageId - 1];
        document.getElementById('screen-map').style.backgroundImage = "url('" + stage.bg + "')";
        document.getElementById('stage-nav-label').innerText = 'ステージ ' + currentStageId;

        document.getElementById('prev-arrow').classList.toggle('disabled', currentStageId <= 1);
        document.getElementById('next-arrow').classList.toggle('disabled', currentStageId >= progress.unlockedStage);

        const clears = getStageClears(currentStageId);
        const container = document.getElementById('map-nodes');
        container.innerHTML = '';

        for (let i = 0; i < 6; i++) {
            const pos = NODE_POSITIONS[i];
            const isBoss = i === 5;
            const isCleared = clears[i];
            const bossLocked = isBoss && !clears.slice(0, 5).every(Boolean);

            const btn = document.createElement('div');
            btn.className = 'node-marker'
                + (isBoss ? ' boss' : '')
                + (isCleared ? ' cleared' : '')
                + (bossLocked ? ' locked' : '');
            btn.style.left = pos.x + '%';
            btn.style.top = pos.y + '%';
            btn.innerText = isBoss ? (isCleared ? '✓' : '★') : (isCleared ? '✓' : String(i + 1));
            btn.onclick = () => selectNode(i);
            container.appendChild(btn);
        }
    }

    function prevStage() {
        if (currentStageId <= 1) return;
        playSfx('select');
        currentStageId--;
        renderMap();
        maybeShowStageIntro();
    }
    function nextStage() {
        if (currentStageId >= progress.unlockedStage) return;
        playSfx('select');
        currentStageId++;
        renderMap();
        maybeShowStageIntro();
    }

    function selectNode(i) {
        const clears = getStageClears(currentStageId);
        const bossLocked = i === 5 && !clears.slice(0, 5).every(Boolean);
        playSfx('select');

        if (bossLocked) {
            showMapToast('ボスへの挑戦には バトルポイントを ぜんぶ クリアしてね！');
            return;
        }

        pendingNodeIndex = i;
        const title = i === 5 ? 'ステージボス' : ('バトルポイント ' + (i + 1));
        document.getElementById('node-popup-title').innerText = title + (clears[i] ? '（クリアずみ）' : '');
        document.getElementById('node-popup').style.display = 'flex';
    }

    function closeNodePopup() {
        playSfx('select');
        document.getElementById('node-popup').style.display = 'none';
    }

    function confirmBattleStart() {
        playSfx('decide');
        document.getElementById('node-popup').style.display = 'none';
        startBattle(pendingNodeIndex);
    }

    /* ===================================================================
       メニュー / しれいしつ
    =================================================================== */
    function openMenu() {
        playSfx('select');
        document.getElementById('menu-overlay').style.display = 'flex';
    }
    function closeMenu() {
        playSfx('select');
        document.getElementById('menu-overlay').style.display = 'none';
    }
    function openShireishitsu() {
        playSfx('decide');
        document.getElementById('menu-overlay').style.display = 'none';
        renderShireishitsu();
        document.getElementById('shireishitsu-overlay').style.display = 'flex';
    }
    function closeShireishitsu() {
        playSfx('select');
        document.getElementById('shireishitsu-overlay').style.display = 'none';
    }
    function renderShireishitsu() {
        const list = document.getElementById('character-list');
        list.innerHTML = '';
        CHARACTERS.forEach(c => {
            const card = document.createElement('div');
            card.className = 'character-card' + (progress.selectedCharacter === c.id ? ' selected' : '');
            card.innerHTML =
                '<div class="character-thumb" style="background-image:url(\'' + c.img + '\')"></div>' +
                '<div class="character-name">' + c.name + '</div>';
            card.onclick = () => {
                playSfx('select');
                progress.selectedCharacter = c.id;
                saveProgress();
                renderShireishitsu();
            };
            list.appendChild(card);
        });
    }

    /* ===================================================================
       バトル画面
    =================================================================== */
    let currentHour = 3;
    let currentMinute = 0;
    let targetHour = 3;
    let targetMinute = 0;
    let score = 0;
    let isLocked = false;

    const PLAYER_MAX_HP = 3;
    const ENEMY_MAX_HP = 5;
    let playerHP = PLAYER_MAX_HP;
    let enemyHP = ENEMY_MAX_HP;
    let enemyMaxHp = ENEMY_MAX_HP;

    function renderHP() {
        const playerBar = document.getElementById('player-hp');
        const enemyBar = document.getElementById('enemy-hp');

        playerBar.innerHTML = '';
        for (let i = 0; i < PLAYER_MAX_HP; i++) {
            const seg = document.createElement('div');
            seg.className = 'hp-seg player ' + (i < playerHP ? 'filled' : 'empty');
            playerBar.appendChild(seg);
        }

        enemyBar.innerHTML = '';
        for (let i = 0; i < enemyMaxHp; i++) {
            const seg = document.createElement('div');
            seg.className = 'hp-seg enemy ' + (i < enemyHP ? 'filled' : 'empty');
            enemyBar.appendChild(seg);
        }
    }

    function flashHit(elementId) {
        const el = document.getElementById(elementId);
        el.classList.add('hit-flash');
        setTimeout(() => el.classList.remove('hit-flash'), 300);
    }

    function shakeElement(elementId) {
        const el = document.getElementById(elementId);
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
    }

    function showMessage(text, duration) {
        const msg = document.getElementById('message-overlay');
        msg.innerText = text;
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, duration);
    }

    function drawClockHands(hour, minute) {
        const canvas = document.getElementById('handCanvas');
        const ctx = canvas.getContext('2d');
        const cx = 165;
        const cy = 165;
        const scale = 1.5;

        ctx.clearRect(0, 0, 330, 330);

        ctx.save();
        ctx.translate(cx, cy);
        const hourAngle = ((hour % 12 + minute / 60) / 12) * 2 * Math.PI - Math.PI / 2;
        ctx.rotate(hourAngle);
        ctx.beginPath();
        ctx.moveTo(-6 * scale, -6 * scale);
        ctx.lineTo(50 * scale, -6 * scale);
        ctx.lineTo(60 * scale, 0);
        ctx.lineTo(50 * scale, 6 * scale);
        ctx.lineTo(-6 * scale, 6 * scale);
        ctx.closePath();
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        const minAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
        ctx.rotate(minAngle);
        ctx.beginPath();
        ctx.moveTo(-5 * scale, -5 * scale);
        ctx.lineTo(70 * scale, -5 * scale);
        ctx.lineTo(80 * scale, 0);
        ctx.lineTo(70 * scale, 5 * scale);
        ctx.lineTo(-5 * scale, 5 * scale);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, 5 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();
    }

    function generateQuestion() {
        targetHour = Math.floor(Math.random() * 12) + 1;
        targetMinute = Math.random() < 0.5 ? 0 : 30;
        drawClockHands(targetHour, targetMinute);
    }

    function changeHour(delta) {
        if (isLocked) return;
        playSfx('select');
        currentHour += delta;
        if (currentHour > 12) currentHour = 1;
        if (currentHour < 1) currentHour = 12;
        document.getElementById('hour-display').innerText = String(currentHour).padStart(2, '0');
    }

    function changeMinute() {
        if (isLocked) return;
        playSfx('select');
        // 00と30の2値だけなので、押すたびに切り替えることで無限にループする
        currentMinute = currentMinute === 0 ? 30 : 0;
        document.getElementById('minute-display').innerText = String(currentMinute).padStart(2, '0');
    }

    function checkAnswer() {
        if (isLocked) return;
        playSfx('decide');

        if (currentHour === targetHour && currentMinute === targetMinute) {
            handleCorrect();
        } else {
            handleWrong();
        }
    }

    function startBattle(nodeIndex) {
        showScreen('battle');
        playBgm('battle');

        const playerEl = document.getElementById('player');
        const enemyEl = document.getElementById('enemy');

        // 前回のバトルの揺れ・光り演出のクラスが残っていることがあるため、
        // バトル開始時に必ずリセットする（開始直後に味方が揺れて見えるバグの対策）
        playerEl.classList.remove('shake', 'hit-flash');
        enemyEl.classList.remove('shake', 'hit-flash');
        playerEl.style.transform = 'none';

        const charDef = CHARACTERS.find(c => c.id === progress.selectedCharacter) || CHARACTERS[0];
        playerEl.style.backgroundImage = "url('" + charDef.img + "')";

        const isBoss = nodeIndex === 5;
        if (isBoss) {
            enemyEl.style.backgroundImage = "url('Images/CW/hades.png')";
        } else {
            const randomEnemy = NORMAL_ENEMY_IMAGES[Math.floor(Math.random() * NORMAL_ENEMY_IMAGES.length)];
            enemyEl.style.backgroundImage = "url('" + randomEnemy + "')";
        }
        enemyEl.style.display = 'block';

        enemyMaxHp = isBoss ? ENEMY_MAX_HP + 3 : ENEMY_MAX_HP;
        playerHP = PLAYER_MAX_HP;
        enemyHP = enemyMaxHp;
        renderHP();

        document.getElementById('stage-text').innerText =
            isBoss ? ('ステージ' + currentStageId + ' ボス') : ('ステージ' + currentStageId + '-' + (nodeIndex + 1));

        isLocked = false;
        generateQuestion();
    }

    function backToMap() {
        if (isLocked) return;
        playSfx('select');
        showScreen('map');
        playBgm('map');
        renderMap();
    }

    function onNodeCleared() {
        const clears = getStageClears(currentStageId);
        clears[pendingNodeIndex] = true;
        if (pendingNodeIndex === 5 && currentStageId === progress.unlockedStage && currentStageId < STAGES.length) {
            progress.unlockedStage = currentStageId + 1;
        }
        saveProgress();
    }

    function handleCorrect() {
        enemyHP = Math.max(0, enemyHP - 1);
        renderHP();
        flashHit('enemy');
        shakeElement('enemy');
        playSfx('hit');

        if (enemyHP > 0) {
            isLocked = true;
            setTimeout(() => {
                generateQuestion();
                isLocked = false;
            }, 450);
            return;
        }

        // ===== 敵を倒した！ =====
        isLocked = true;
        playSfx('correct');
        score++;
        document.getElementById('score-text').innerText = "たおしたてき: " + score;

        showMessage("てきを たおした！\nクリア！", 2000);

        const enemy = document.getElementById('enemy');
        const player = document.getElementById('player');

        // 勝利モーション（軽くジャンプ）
        let hops = 0;
        const hopAnim = setInterval(() => {
            hops++;
            player.style.transform = "translateY(" + (hops % 2 === 1 ? -14 : 0) + "px)";
            if (hops >= 6) {
                clearInterval(hopAnim);
                player.style.transform = "none";
                enemy.style.display = "none";
            }
        }, 130);

        setTimeout(() => {
            player.style.transform = "none";
            onNodeCleared();
            showScreen('map');
            playBgm('map');
            renderMap();
            isLocked = false;
        }, 2000);
    }

    function handleWrong() {
        playSfx('wrong');
        flashHit('player');
        shakeElement('player');
        playerHP = Math.max(0, playerHP - 1);
        renderHP();

        if (playerHP > 0) {
            isLocked = true;
            showMessage("ざんねん！\nもういちど チャレンジ！", 1200);
            setTimeout(() => { isLocked = false; }, 1200);
        } else {
            isLocked = true;
            showMessage("エネルギーぎれ！\nたいせい たてなおし！", 1500);
            setTimeout(() => {
                playerHP = PLAYER_MAX_HP;
                renderHP();
                isLocked = false;
            }, 1500);
        }
    }

    /* ===================================================================
       初期化
    =================================================================== */
    showScreen('top');
