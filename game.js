/* ===================================================================
    サウンド関連
================================================================== */
let soundOn = true;

// ステージごとのフィールドBGMマッピング（6〜10は一旦同じ音源に設定）
const STAGE_BGMS = {
    1: new Audio(encodeURI('Sounds/オープニングオーケストラ「夜明け」.mp3')),
    2: new Audio(encodeURI('Sounds/雲海.mp3')),
    3: new Audio(encodeURI('Sounds/遠い空へ.mp3')),
    4: new Audio(encodeURI('Sounds/試練の道.mp3')),
    5: new Audio(encodeURI('Sounds/秘境の地.mp3')),
    6: new Audio(encodeURI('Sounds/ブラックファクトリー.mp3')),
    7: new Audio(encodeURI('Sounds/ブラックファクトリー.mp3')),
    8: new Audio(encodeURI('Sounds/ブラックファクトリー.mp3')),
    9: new Audio(encodeURI('Sounds/ブラックファクトリー.mp3')),
    10: new Audio(encodeURI('Sounds/ブラックファクトリー.mp3'))
};

// バトル用・ボス用のBGM
const battleBgm = new Audio(encodeURI('Sounds/炎乱.mp3'));
const bossBgm = new Audio(encodeURI('Sounds/Battle_in_the_Moonlight.mp3'));

// すべてのBGMのループとボリュームを設定
for (const key in STAGE_BGMS) {
    STAGE_BGMS[key].loop = true;
    STAGE_BGMS[key].volume = 0.35;
}
battleBgm.loop = true;
battleBgm.volume = 0.35;
bossBgm.loop = true;
bossBgm.volume = 0.35;

const sfx = {
    select: new Audio(encodeURI('Sounds/セレクト音風な効果音.mp3')),
    decide: new Audio(encodeURI('Sounds/システム決定音_9.mp3')),
    correct: new Audio(encodeURI('Sounds/ゲームクリアー！.mp3')),
    wrong: new Audio(encodeURI('Sounds/爆破・爆発音.mp3')),
    hit: new Audio(encodeURI('Sounds/打撃音.mp3')),
    critical: new Audio(encodeURI('Sounds/レーザー攻撃.mp3'))
};
const sfxDefaultVolume = { select: 0.7, decide: 0.7, correct: 0.7, wrong: 0.7, hit: 0.7, critical: 0.8 };
for (const key in sfx) {
    sfx[key].volume = sfxDefaultVolume[key] ?? 0.7;
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

function stopAllBgm() {
    for (const key in STAGE_BGMS) {
        STAGE_BGMS[key].pause();
    }
    battleBgm.pause();
    bossBgm.pause();
}

function playBgm(type, stageId) {
    if (!soundOn) return;
    stopAllBgm();

    if (type === 'map') {
        const bgm = STAGE_BGMS[stageId] || STAGE_BGMS[1];
        bgm.play().catch(() => {});
    } else if (type === 'battle') {
        battleBgm.play().catch(() => {});
    } else if (type === 'boss') {
        bossBgm.play().catch(() => {});
    }
}

function toggleSound() {
    soundOn = !soundOn;
    document.getElementById('sound-toggle').innerText = soundOn ? '🔊' : '🔇';
    if (!soundOn) {
        stopAllBgm();
    } else {
        if (currentScreen === 'map') playBgm('map', currentStageId);
        if (currentScreen === 'battle') {
            const isBoss = pendingNodeIndex === 5;
            playBgm(isBoss ? 'boss' : 'battle');
        }
    }
}

/* ===================================================================
    ゲームデータ ＆ キャラクタープロフィール
================================================================== */
const STAGES = [
    { id: 1, bg: 'Images/stage/map01_メタバース空間.png' },
    { id: 2, bg: 'Images/stage/map02_森.png' },
    { id: 3, bg: 'Images/stage/map03_砂漠.png' },
    { id: 4, bg: 'Images/stage/map04_宇宙.png' },
    { id: 5, bg: 'Images/stage/map05_雪山.png' },
    { id: 6, bg: 'Images/stage/map06_桜.png' },
    { id: 7, bg: 'Images/stage/map07_深海.png' },
    { id: 8, bg: 'Images/stage/map08_海上.png' },
    { id: 9, bg: 'Images/stage/map09_マグマ.png' },
    { id: 10, bg: 'Images/stage/map10_終焉.png' }
];

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
    { id: 'e7kagayaki', name: 'E7 かがやき', img: 'Images/CW/e7kagayaki.png' },
    { id: 'e8tsubasa', name: 'E8 つばさ', img: 'Images/CW/e8tsubasa.png' },
    { id: 'h5hayabusa', name: 'H5 はやぶさ', img: 'Images/CW/h5hayabusa.png' },
    { id: 'n700skamome', name: 'N700S かもめ', img: 'Images/CW/n700skamome.png' },
    { id: 'n700snozomi', name: 'N700S のぞみ', img: 'Images/CW/n700snozomi.png' },
    { id: 'yellow', name: 'ドクターイエロー', img: 'Images/CW/yellow.png' },
    { id: 'srg', name: 'SRG', img: 'Images/CW/srg.png' }     
];

const SHINKALION_PROFILES = {
    "500kodama": {
        name: "５００こだまジンキフォーム",
        soubi: "ダイナミックギガスパナ",
        hissatsu: "—",
        untenshi: "西大路 ヤマト"
    },
    "e5hayabusa": {
        name: "Ｅ５はやぶさトレーラーフォーム",
        soubi: "リクソウセイバー",
        hissatsu: "グランクロス",
        untenshi: "大成 タイセイ"
    },
    "e6komachi": {
        name: "Ｅ６こまちトップリフターフォーム",
        soubi: "キンテイガン",
        hissatsu: "ツイストロックバスター",
        untenshi: "フォールデンアカネ"
    },
    "e7kagayaki": {
        name: "Ｅ７かがやきドリルフォーム",
        soubi: "クッサクバンパー",
        hissatsu: "ツインクッサクドリル",
        untenshi: "九頭竜 リョータ"
    },
    "e8tsubasa": {
        name: "Ｅ８つばさドローンフォーム",
        soubi: "ホーネットライフル",
        hissatsu: "—",
        untenshi: "最上 ガンマ"
    },
    "h5hayabusa": {
        name: "Ｈ５はやぶさドーザーフォーム",
        soubi: "ドーザーハイドアーム",
        hissatsu: "—",
        untenshi: "五稜郭 シオン"
    },
    "n700skamome": {
        name: "Ｎ７００Ｓかもめフェリーフォーム",
        soubi: "サンドウカトラス",
        hissatsu: "—",
        untenshi: "海風 ツクモ"
    },
    "n700snozomi": {
        name: "Ｎ７００Ｓのぞみブルートレーラー",
        soubi: "リクソウブレード",
        hissatsu: "—",
        untenshi: "魚虎 テン"
    },
    "phantom": {
        name: "ファントムシンカリオン",
        soubi: "ファントムガントレットソード",
        hissatsu: "—",
        untenshi: "大成 イナ"
    },
    "srg": {
        name: "シンカリオンＳＲＧ",
        soubi: "—",
        hissatsu: "—",
        untenshi: "タイセイ・アカネ・リョータ"
    },
    "yellow": {
        name: "グレートドクターイエロー",
        soubi: "グレートケンソクブレード",
        hissatsu: "—",
        untenshi: "梔子 モリット"
    },
    "zero": {
        name: "シンカリオン ０",
        soubi: "ゼロブレード",
        hissatsu: "—",
        untenshi: "工部 レイジ"
    }
};

const STAGE_1_5_ENEMIES = [
    'Images/CW/敵1.png',
    'Images/CW/敵2.png',
    'Images/CW/敵3.png',
    'Images/CW/敵4.png',
    'Images/CW/敵5.png'
];

const STAGE_6_10_ENEMIES = [
    'Images/CW/敵6.png',
    'Images/CW/敵7.png',
    'Images/CW/敵8.png',
    'Images/CW/敵9.png',
    'Images/CW/敵10.png'
];

/* ===================================================================
    ゲーム状態・変数
================================================================== */
let currentScreen = 'top';
let currentStageId = 1;
let currentNodeIndex = 0;
let pendingNodeIndex = null;
let isLocked = false;

let playerHP = 100;
let enemyHP = 100;
const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 100;
let enemyMaxHp = 100;

let clearedNodesInStage = [];

let progress = {
    unlockedStage: 1,
    clearedStages: [],
    selectedCharacter: 'e5hayabusa',
    completedNodes: {}
};

window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    initShireishitsu();
});

function showScreen(screenId) {
    currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    const target = document.getElementById('screen-' + screenId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
}

function startGame() {
    playSfx('decide');
    openMapScreen();
}

function prevStage() {
    if (currentStageId > 1) {
        currentStageId--;
        playSfx('select');
        updateStageNav();
        openMapScreen();
    }
}

function nextStage() {
    if (currentStageId < progress.unlockedStage && currentStageId < STAGES.length) {
        currentStageId++;
        playSfx('select');
        updateStageNav();
        openMapScreen();
    }
}

function updateStageNav() {
    const label = document.getElementById('stage-nav-label');
    if (label) label.innerText = 'ステージ ' + currentStageId;
    
    const prevArrow = document.getElementById('prev-arrow');
    const nextArrow = document.getElementById('next-arrow');
    if (prevArrow) prevArrow.style.visibility = (currentStageId > 1) ? 'visible' : 'hidden';
    if (nextArrow) nextArrow.style.visibility = (currentStageId < progress.unlockedStage && currentStageId < STAGES.length) ? 'visible' : 'hidden';
}

function openMapScreen() {
    showScreen('map');
    playBgm('map', currentStageId);
    updateStageNav();

    const stageDef = STAGES[currentStageId - 1];
    document.getElementById('screen-map').style.backgroundImage = "url('" + stageDef.bg + "')";

    if (!progress.completedNodes[currentStageId]) {
        progress.completedNodes[currentStageId] = [];
    }
    clearedNodesInStage = progress.completedNodes[currentStageId];

    const nodesContainer = document.getElementById('map-nodes');
    if (!nodesContainer) return;
    nodesContainer.innerHTML = '';

    NODE_POSITIONS.forEach((pos, index) => {
        const nodeBtn = document.createElement('div');
        nodeBtn.className = 'map-node';
        if (index === 5) nodeBtn.classList.add('boss-node');
        nodeBtn.style.left = pos.x + '%';
        nodeBtn.style.top = pos.y + '%';
        nodeBtn.innerText = index === 5 ? '★' : (index + 1);

        const isCleared = clearedNodesInStage.includes(index);
        let isEnabled = false;

        if (index === 0) {
            isEnabled = true;
        } else if (index < 5) {
            if (clearedNodesInStage.includes(index - 1) || isCleared) {
                isEnabled = true;
            }
        } else if (index === 5) {
            if (clearedNodesInStage.includes(3) || clearedNodesInStage.includes(4)) {
                isEnabled = true;
            }
        }

        if (isCleared) {
            nodeBtn.classList.add('cleared');
        } else if (isEnabled) {
            nodeBtn.classList.add('active');
            nodeBtn.onclick = () => {
                playSfx('decide');
                pendingNodeIndex = index;
                openNodePopup(index);
            };
        } else {
            nodeBtn.classList.add('locked');
        }
        nodesContainer.appendChild(nodeBtn);
    });
}
function openNodePopup(index) {
    const popup = document.getElementById('node-popup');
    const title = document.getElementById('node-popup-title');
    if (title) {
        title.innerText = index === 5 ? ('ステージ ' + currentStageId + ' ボス') : ('バトルポイント ' + (index + 1));
    }
    if (popup) popup.style.display = 'flex';
}

function closeNodePopup() {
    playSfx('select');
    const popup = document.getElementById('node-popup');
    if (popup) popup.style.display = 'none';
}

function confirmBattleStart() {
    closeNodePopup();
    startBattle(pendingNodeIndex);
}

/* ===================================================================
    メニュー ＆ しれいしつ
================================================================== */
function openMenu() {
    playSfx('select');
    const menu = document.getElementById('menu-overlay');
    if (menu) menu.style.display = 'flex';
}

function closeMenu() {
    playSfx('select');
    const menu = document.getElementById('menu-overlay');
    if (menu) menu.style.display = 'none';
}

function openShireishitsu() {
    closeMenu();
    playSfx('select');
    const shiri = document.getElementById('shireishitsu-overlay');
    if (shiri) shiri.style.display = 'flex';
    initShireishitsu();
}

function initShireishitsu() {
    const grid = document.getElementById('character-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CHARACTERS.forEach(ch => {
        const item = document.createElement('div');
        item.className = 'character-grid-item' + (progress.selectedCharacter === ch.id ? ' selected' : '');
        item.style.backgroundImage = "url('" + ch.img + "')";
        item.onclick = () => {
            playSfx('select');
            progress.selectedCharacter = ch.id;
            saveProgress();
            document.querySelectorAll('.character-grid-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            updateCharacterPreview(ch.id);
        };
        grid.appendChild(item);
    });

    updateCharacterPreview(progress.selectedCharacter);
}

function updateCharacterPreview(chId) {
    const ch = CHARACTERS.find(c => c.id === chId) || CHARACTERS[0];
    const profile = SHINKALION_PROFILES[ch.id] || { name: ch.name, soubi: "—", hissatsu: "—", untenshi: "—" };

    const imgEl = document.getElementById('character-preview-img');
    const nameEl = document.getElementById('character-preview-name');
    const soubiEl = document.getElementById('profile-soubi');
    const hissatsuEl = document.getElementById('profile-hissatsu');
    const untenshiEl = document.getElementById('profile-untenshi');

    if (imgEl) imgEl.style.backgroundImage = "url('" + ch.img + "')";
    if (nameEl) nameEl.innerText = profile.name;
    if (soubiEl) soubiEl.innerText = profile.soubi;
    if (hissatsuEl) hissatsuEl.innerText = profile.hissatsu;
    if (untenshiEl) untenshiEl.innerText = profile.untenshi;
}

function closeShireishitsu() {
    playSfx('decide');
    const shiri = document.getElementById('shireishitsu-overlay');
    if (shiri) shiri.style.display = 'none';
}

function backToMap() {
    playSfx('select');
    openMapScreen();
}

/* ===================================================================
    バトル画面 ＆ クイズ・時計処理
================================================================== */
function startBattle(nodeIndex) {
    showScreen('battle');
    const isBoss = nodeIndex === 5;
    playBgm(isBoss ? 'boss' : 'battle');

    const stageDef = STAGES[currentStageId - 1];
    document.getElementById('screen-battle').style.backgroundImage = "url('" + stageDef.bg + "')";

    const playerEl = document.getElementById('player');
    const enemyEl = document.getElementById('enemy');

    playerEl.style.transform = 'none';
    const charDef = CHARACTERS.find(c => c.id === progress.selectedCharacter) || CHARACTERS[0];
    playerEl.style.backgroundImage = "url('" + charDef.img + "')";

    if (isBoss) {
        enemyEl.style.backgroundImage = "url('Images/CW/hades.png')";
    } else {
        let pool = (currentStageId <= 5) ? STAGE_1_5_ENEMIES : STAGE_6_10_ENEMIES;
        const randomEnemy = pool[Math.floor(Math.random() * pool.length)];
        enemyEl.style.backgroundImage = "url('" + randomEnemy + "')";
    }
    enemyEl.style.display = 'block';

    enemyMaxHp = isBoss ? ENEMY_MAX_HP + 3 : ENEMY_MAX_HP;
    playerHP = PLAYER_MAX_HP;
    enemyHP = enemyMaxHp;
    renderHP();

    const stageText = document.getElementById('stage-text');
    if (stageText) {
        stageText.innerText = isBoss ? ('ステージ' + currentStageId + ' ボス') : ('ステージ' + currentStageId + '-' + (nodeIndex + 1));
    }

    isLocked = false;
    generateQuestion();
}

function renderHP() {
    const pBar = document.getElementById('player-hp');
    const eBar = document.getElementById('enemy-hp');
    if (pBar) pBar.style.width = Math.max(0, (playerHP / PLAYER_MAX_HP) * 100) + '%';
    if (eBar) eBar.style.width = Math.max(0, (enemyHP / enemyMaxHp) * 100) + '%';
}

let targetHour = 3;
let targetMinute = 0;
let currentHour = 3;
let currentMinute = 0;

function generateQuestion() {
    targetHour = Math.floor(Math.random() * 12) + 1;
    targetMinute = Math.floor(Math.random() * 12) * 5;

    currentHour = (targetHour + Math.floor(Math.random() * 3) - 1 + 12) % 12 || 12;
    currentMinute = (targetMinute + (Math.floor(Math.random() * 4) - 2) * 5 + 60) % 60;

    updateClockDisplay();
}

function changeHour(delta) {
    playSfx('select');
    currentHour = ((currentHour - 1 + delta + 12) % 12) + 1;
    updateClockDisplay();
}

function changeMinute() {
    playSfx('select');
    currentMinute = (currentMinute + 5) % 60;
    updateClockDisplay();
}

function updateClockDisplay() {
    const hDisp = document.getElementById('hour-display');
    const mDisp = document.getElementById('minute-display');
    if (hDisp) hDisp.innerText = String(currentHour).padStart(2, '0');
    if (mDisp) mDisp.innerText = String(currentMinute).padStart(2, '0');

    drawClockHands(currentHour, currentMinute);
}

function drawClockHands(hour, minute) {
    const canvas = document.getElementById('handCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const minuteAngle = (minute / 60) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#333';
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minuteAngle) * 110, cy + Math.sin(minuteAngle) * 110);
    ctx.stroke();

    const hourAngle = ((hour % 12) / 12) * 2 * Math.PI + (minute / 60) * (2 * Math.PI / 12) - Math.PI / 2;
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hourAngle) * 75, cy + Math.sin(hourAngle) * 75);
    ctx.stroke();
}

function checkAnswer() {
    if (isLocked) return;
    isLocked = true;

    const isCorrect = (currentHour === targetHour && currentMinute === targetMinute);

    if (isCorrect) {
        playSfx('correct');
        triggerPlayerAttack(() => {
            const damage = Math.floor(enemyMaxHp / 3) + 1;
            enemyHP = Math.max(0, enemyHP - damage);
            renderHP();
            triggerEnemyHit(() => {
                if (enemyHP <= 0) {
                    endBattle(true);
                } else {
                    setTimeout(generateQuestion, 600);
                    isLocked = false;
                }
            });
        });
    } else {
        playSfx('wrong');
        triggerEnemyAttack(() => {
            const damage = 35;
            playerHP = Math.max(0, playerHP - damage);
            renderHP();
            triggerPlayerHit(() => {
                if (playerHP <= 0) {
                    endBattle(false);
                } else {
                    isLocked = false;
                }
            });
        });
    }
}

function triggerPlayerAttack(callback) {
    const playerEl = document.getElementById('player');
    playSfx('critical');
    if (playerEl) {
        playerEl.style.transition = 'transform 0.2s';
        playerEl.style.transform = 'translateX(60px) scale(1.1)';
        setTimeout(() => {
            playerEl.style.transform = 'none';
            setTimeout(callback, 200);
        }, 200);
    } else {
        callback();
    }
}

function triggerEnemyHit(callback) {
    playSfx('hit');
    setTimeout(callback, 400);
}

function triggerEnemyAttack(callback) {
    playSfx('hit');
    setTimeout(callback, 200);
}

function triggerPlayerHit(callback) {
    setTimeout(callback, 400);
}

function endBattle(isWin) {
    const overlay = document.getElementById('message-overlay');
    if (overlay) {
        overlay.innerText = isWin ? 'ステージクリア！' : 'はいぼく…';
        overlay.style.display = 'block';
    }

    if (isWin) {
        if (!clearedNodesInStage.includes(pendingNodeIndex)) {
            clearedNodesInStage.push(pendingNodeIndex);
        }
        if (pendingNodeIndex === 5) {
            if (!progress.clearedStages.includes(currentStageId)) {
                progress.clearedStages.push(currentStageId);
            }
            if (currentStageId < STAGES.length && currentStageId >= progress.unlockedStage) {
                progress.unlockedStage = currentStageId + 1;
            }
        }
        saveProgress();
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            openMapScreen();
        }, 1500);
    } else {
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            openMapScreen();
        }, 1500);
    }
}

/* ===================================================================
    データ保存・読み込み
================================================================== */
function saveProgress() {
    try {
        localStorage.setItem('shinkalion_quiz_progress', JSON.stringify(progress));
    } catch (e) {}
}

function loadProgress() {
    try {
        const saved = localStorage.getItem('shinkalion_quiz_progress');
        if (saved) {
            const data = JSON.parse(saved);
            progress.unlockedStage = data.unlockedStage || 1;
            progress.clearedStages = data.clearedStages || [];
            progress.selectedCharacter = data.selectedCharacter || 'e5hayabusa';
            progress.completedNodes = data.completedNodes || {};
        }
    } catch (e) {}
}
