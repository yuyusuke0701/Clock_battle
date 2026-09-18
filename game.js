/* ===================================================================
    定数・データ定義
================================================================== */
const CHARACTERS = [
    { id: 'e5hayabusa', name: 'E5はやぶさ', img: 'Images/CW/e5hayabusa.png' },
    { id: 'e6komachi', name: 'E6こまち', img: 'Images/CW/e6komachi.png' },
    { id: 'e7kagayaki', name: 'E7かがやき', img: 'Images/CW/e7kagayaki.png' },
    { id: 'h5hayabusa', name: 'H5はやぶさ', img: 'Images/CW/h5hayabusa.png' },
    { id: '800tsubame', name: '800つばめ', img: 'Images/CW/800tsubame.png' },
    { id: 'n700s', name: 'N700Sのぞみ', img: 'Images/CW/n700s.png' },
    { id: '500kodama', name: '500こだま', img: 'Images/CW/500kodama.png' },
    { id: 'h5alphax', name: 'E8つばさ', img: 'Images/CW/e8tsubasa.png' }
];

const SHINKALION_PROFILES = {
    'e5hayabusa': { name: 'E5はやぶさトレーラーフォーム', soubi: 'リクソウセイバー', hissatsu: 'グランクロス', untenshi: '大成タイセイ' },
    'e6komachi': { name: 'E6こまち', soubi: 'フミキリガン', hissatsu: 'ガリウムシュート', untenshi: 'フォールツバサ' },
    'e7kagayaki': { name: 'E7かがやき', soubi: 'シャリレンソード', hissatsu: 'オオマエザキ砲', untenshi: '九頭竜リョータ' },
    'h5hayabusa': { name: 'H5はやぶさ', soubi: 'カイキョウソード', hissatsu: 'グランクロス', untenshi: '北海道の運転士' },
    '800tsubame': { name: '800つばめ', soubi: 'パンタグラフアロー', hissatsu: '九州ブラスト', untenshi: '大成イナ' },
    'n700s': { name: 'N700Sのぞみ', soubi: 'JRクナイ', hissatsu: 'アドバンスブレード', untenshi: '青梅キリン' },
    '500kodama': { name: '500こだま', soubi: 'シンカウエポン', hissatsu: 'ソニックウェーブ', untenshi: '速杉ハヤト' },
    'h5alphax': { name: 'E8つばさ', soubi: 'テツノコブシ', hissatsu: 'ウイングブーメラン', untenshi: '月山シノブ' }
};

const STAGES = [
    { id: 1, name: "ステージ 1", bg: "Images/CW/bg_stage1.jpg" },
    { id: 2, name: "ステージ 2", bg: "Images/CW/bg_stage2.jpg" },
    { id: 3, name: "ステージ 3", bg: "Images/CW/bg_stage3.jpg" },
    { id: 4, name: "ステージ 4", bg: "Images/CW/bg_stage4.jpg" },
    { id: 5, name: "ステージ 5", bg: "Images/CW/bg_stage5.jpg" }
];

const STAGE_1_5_ENEMIES = [
    'Images/CW/enemy1.png',
    'Images/CW/enemy2.png'
];
const STAGE_6_10_ENEMIES = [
    'Images/CW/enemy1.png',
    'Images/CW/enemy2.png'
];

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 100;

let playerHP = PLAYER_MAX_HP;
let enemyHP = ENEMY_MAX_HP;
let enemyMaxHp = ENEMY_MAX_HP;

let currentStageId = 1;
let pendingNodeIndex = 0;
let clearedNodesInStage = [];
let isLocked = false;

let progress = {
    unlockedStage: 1,
    clearedStages: [],
    selectedCharacter: 'e5hayabusa',
    completedNodes: {}
};

let audioMuted = false;

/* ===================================================================
    初期化・画面切り替え
================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    setupSoundToggle();
});

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
    const target = document.getElementById('screen-' + screenId);
    if (target) target.style.display = 'block';
}

function startGame() {
    playSfx('decide');
    openMapScreen();
}

function setupSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
        btn.onclick = () => {
            audioMuted = !audioMuted;
            btn.innerText = audioMuted ? '🎵 OFF' : '🎵 ON';
        };
    }
}

function playSfx(type) {
    if (audioMuted) return;
    // 効果音再生処理（必要に応じて追加）
}

function playBgm(type) {
    if (audioMuted) return;
    // BGM再生処理（必要に応じて追加）
}

/* ===================================================================
    マップ画面 ＆ ノード生成
================================================================== */
function openMapScreen() {
    showScreen('map');
    playBgm('map');
    updateStageNav();
    renderMapNodes();
}

function updateStageNav() {
    const textEl = document.getElementById('stage-nav-text');
    if (textEl) textEl.innerText = STAGES[currentStageId - 1].name;

    const prevBtn = document.getElementById('prev-stage-btn');
    const nextBtn = document.getElementById('next-stage-btn');
    if (prevBtn) prevBtn.classList.toggle('disabled', currentStageId <= 1);
    if (nextBtn) nextBtn.classList.toggle('disabled', currentStageId >= progress.unlockedStage || currentStageId >= STAGES.length);

    const screenMap = document.getElementById('screen-map');
    if (screenMap) {
        screenMap.style.backgroundImage = "url('" + STAGES[currentStageId - 1].bg + "')";
    }
}

function changeStage(delta) {
    playSfx('select');
    const newId = currentStageId + delta;
    if (newId >= 1 && newId <= progress.unlockedStage && newId <= STAGES.length) {
        currentStageId = newId;
        clearedNodesInStage = progress.completedNodes[currentStageId] || [];
        updateStageNav();
        renderMapNodes();
    }
}

function renderMapNodes() {
    const container = document.getElementById('map-nodes');
    if (!container) return;
    container.innerHTML = '';

    clearedNodesInStage = progress.completedNodes[currentStageId] || [];

    // ステップごとの座標配置（ステージマップ上の位置）
    const nodeCoords = [
        { x: 50, y: 78 }, // 0
        { x: 30, y: 64 }, // 1
        { x: 70, y: 50 }, // 2
        { x: 35, y: 36 }, // 3
        { x: 65, y: 22 }, // 4
        { x: 50, y: 10 }  // 5 (ボス)
    ];

    nodeCoords.forEach((coord, index) => {
        const marker = document.createElement('div');
        const isBoss = (index === 5);
        const isCleared = clearedNodesInStage.includes(index);
        
        // 前のノードがクリアされているか、最初のノード、またはボス手前までクリア済みなら解放
        const isUnlocked = (index === 0) || clearedNodesInStage.includes(index - 1) || isCleared;

        let className = 'node-marker';
        if (isBoss) className += ' boss';
        if (isCleared) className += ' cleared';
        if (!isUnlocked) className += ' locked';

        marker.className = className;
        marker.style.left = coord.x + '%';
        marker.style.top = coord.y + '%';
        marker.innerText = isBoss ? 'BOSS' : (index + 1);

        marker.onclick = () => {
            if (!isUnlocked) {
                playSfx('wrong');
                showMapToast('前のバトルポイントをクリアしてください！');
                return;
            }
            playSfx('select');
            pendingNodeIndex = index;
            openNodePopup(index);
        };

        container.appendChild(marker);
    });
}

function showMapToast(msg) {
    const toast = document.getElementById('map-toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
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
        // CSSのクラス構造に合わせて card / thumb / name を生成
        const item = document.createElement('button');
        item.className = 'character-face-card' + (progress.selectedCharacter === ch.id ? ' selected' : '');
        
        const thumb = document.createElement('div');
        thumb.className = 'character-face-thumb';
        thumb.style.backgroundImage = "url('" + ch.img + "')";
        
        const nameEl = document.createElement('div');
        nameEl.className = 'character-face-name';
        nameEl.innerText = ch.name;

        item.appendChild(thumb);
        item.appendChild(nameEl);

        item.onclick = () => {
            playSfx('select');
            progress.selectedCharacter = ch.id;
            saveProgress();
            document.querySelectorAll('.character-face-card').forEach(el => el.classList.remove('selected'));
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
        // クリア状況をcompletedNodesに保存
        progress.completedNodes[currentStageId] = clearedNodesInStage;
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
