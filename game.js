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
        name: "Ｅ６こまちトップリフターフォー",
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
        name: "Ｎ７００Ｓかもめフェリーフォー",
        soubi: "サンドウカトラス",
        hissatsu: "—",
        untenshi: "海風 ツクモ"
    },
    "n700snozomi": {
        name: "Ｎ７００Ｓのぞみブルートレーラ",
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

// ステージ1〜5用：敵1〜5
const STAGE_1_5_ENEMIES = [
    'Images/CW/敵1.png',
    'Images/CW/敵2.png',
    'Images/CW/敵3.png',
    'Images/CW/敵4.png',
    'Images/CW/敵5.png'
];

// ステージ6〜10用：敵6〜10
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
let currentScreen = 'title';
let currentStageId = 1;
let currentNodeIndex = 0;
let pendingNodeIndex = null;
let isLocked = false;

let playerHP = 100;
let enemyHP = 100;
const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 100;
let enemyMaxHp = 100;

let currentQuestion = null;
let clearedNodesInStage = [];

let progress = {
    unlockedStage: 1,
    clearedStages: [],
    selectedCharacter: 'e5hayabusa',
    completedNodes: {}
};

/* ===================================================================
    初期化と画面遷移
================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    initTitleScreen();
    initStageSelectScreen();
});

function showScreen(screenId) {
    currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
}

/* ===================================================================
    タイトル画面
================================================================== */
function initTitleScreen() {
    const listEl = document.getElementById('title-chara-list');
    listEl.innerHTML = '';
    CHARACTERS.forEach(ch => {
        const div = document.createElement('div');
        div.className = 'title-chara-item' + (progress.selectedCharacter === ch.id ? ' selected' : '');
        div.style.backgroundImage = "url('" + ch.img + "')";
        div.title = ch.name;
        div.onclick = () => {
            playSfx('select');
            progress.selectedCharacter = ch.id;
            saveProgress();
            document.querySelectorAll('.title-chara-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        };
        listEl.appendChild(div);
    });
}

function startGame() {
    playSfx('decide');
    openStageSelect();
}

/* ===================================================================
    ステージ選択画面
================================================================== */
function openStageSelect() {
    showScreen('stage-select');
    const container = document.getElementById('stage-cards-container');
    container.innerHTML = '';

    STAGES.forEach(stage => {
        const card = document.createElement('div');
        card.className = 'stage-card';
        if (stage.id > progress.unlockedStage) {
            card.classList.add('locked');
        }
        card.style.backgroundImage = "url('" + stage.bg + "')";

        const info = document.createElement('div');
        info.className = 'stage-info';
        info.innerHTML = `<h3>ステージ ${stage.id}</h3>`;
        card.appendChild(info);

        if (stage.id <= progress.unlockedStage) {
            card.onclick = () => {
                playSfx('decide');
                currentStageId = stage.id;
                openMapScreen();
            };
        }
        container.appendChild(card);
    });
}

function closeStageSelect() {
    playSfx('select');
    showScreen('title');
}

/* ===================================================================
    マップ画面
================================================================== */
function openMapScreen() {
    showScreen('map');
    playBgm('map', currentStageId);

    const stageDef = STAGES[currentStageId - 1];
    document.getElementById('screen-map').style.backgroundImage = "url('" + stageDef.bg + "')";
    document.getElementById('map-stage-title').innerText = 'ステージ ' + currentStageId;

    if (!progress.completedNodes[currentStageId]) {
        progress.completedNodes[currentStageId] = [];
    }
    clearedNodesInStage = progress.completedNodes[currentStageId];

    const svg = document.getElementById('map-svg');
    svg.innerHTML = '';
    for (let i = 0; i < NODE_POSITIONS.length - 1; i++) {
        const p1 = NODE_POSITIONS[i];
        const p2 = NODE_POSITIONS[i+1];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x + '%');
        line.setAttribute('y1', p1.y + '%');
        line.setAttribute('x2', p2.x + '%');
        line.setAttribute('y2', p2.y + '%');
        line.setAttribute('stroke', 'rgba(255,255,255,0.5)');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-dasharray', '6,6');
        svg.appendChild(line);
    }
    const pLastBefore = NODE_POSITIONS[3];
    const pBoss = NODE_POSITIONS[5];
    const lineBoss = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineBoss.setAttribute('x1', pLastBefore.x + '%');
    lineBoss.setAttribute('y1', pLastBefore.y + '%');
    lineBoss.setAttribute('x2', pBoss.x + '%');
    lineBoss.setAttribute('y2', pBoss.y + '%');
    lineBoss.setAttribute('stroke', 'rgba(255,100,100,0.7)');
    lineBoss.setAttribute('stroke-width', '5');
    svg.appendChild(lineBoss);

    const nodesContainer = document.getElementById('map-nodes-container');
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
                startBattle(index);
            };
        } else {
            nodeBtn.classList.add('locked');
        }
        nodesContainer.appendChild(nodeBtn);
    });
}

function backToStageSelect() {
    playSfx('select');
    openStageSelect();
}

/* ===================================================================
    バトル画面 ＆ クイズ処理
================================================================== */
function startBattle(nodeIndex) {
    showScreen('battle');
    const isBoss = nodeIndex === 5;
    playBgm(isBoss ? 'boss' : 'battle');

    const stageDef = STAGES[currentStageId - 1];
    document.getElementById('screen-battle').style.backgroundImage = "url('" + stageDef.bg + "')";

    const playerEl = document.getElementById('player');
    const enemyEl = document.getElementById('enemy');

    playerEl.classList.remove('shake', 'hit-flash');
    enemyEl.classList.remove('shake', 'hit-flash');
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

    document.getElementById('stage-text').innerText =
        isBoss ? ('ステージ' + currentStageId + ' ボス') : ('ステージ' + currentStageId + '-' + (nodeIndex + 1));

    isLocked = false;
    generateQuestion();
}

function renderHP() {
    document.getElementById('player-hp-bar').style.width = Math.max(0, (playerHP / PLAYER_MAX_HP) * 100) + '%';
    document.getElementById('enemy-hp-bar').style.width = Math.max(0, (enemyHP / enemyMaxHp) * 100) + '%';
    document.getElementById('player-hp-text').innerText = playerHP + ' / ' + PLAYER_MAX_HP;
    document.getElementById('enemy-hp-text').innerText = enemyHP + ' / ' + enemyMaxHp;
}

function generateQuestion() {
    const qTypes = ['soubi', 'hissatsu', 'untenshi'];
    const qType = qTypes[Math.floor(Math.random() * qTypes.length)];

    const keys = Object.keys(SHINKALION_PROFILES);
    const correctKey = keys[Math.floor(Math.random() * keys.length)];
    const correctObj = SHINKALION_PROFILES[correctKey];

    let questionText = '';
    let correctAnswer = '';

    if (qType === 'soubi') {
        questionText = `「${correctObj.name}」の装備（武器など）は何？`;
        correctAnswer = correctObj.soubi;
    } else if (qType === 'hissatsu') {
        questionText = `「${correctObj.name}」の必殺技は何？`;
        correctAnswer = correctObj.hissatsu;
    } else {
        questionText = `「${correctObj.name}」の運転士は誰？`;
        correctAnswer = correctObj.untenshi;
    }

    let choices = [correctAnswer];
    while (choices.length < 4) {
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        const randObj = SHINKALION_PROFILES[randKey];
        let val = '';
        if (qType === 'soubi') val = randObj.soubi;
        else if (qType === 'hissatsu') val = randObj.hissatsu;
        else val = randObj.untenshi;

        if (val && !choices.includes(val)) {
            choices.push(val);
        }
    }
    choices.sort(() => Math.random() - 0.5);

    currentQuestion = { correctAnswer: correctAnswer };
    document.getElementById('question-text').innerText = questionText;

    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice;
        btn.onclick = () => handleAnswer(choice, btn);
        choicesContainer.appendChild(btn);
    });
}

function handleAnswer(selectedChoice, btnElement) {
    if (isLocked) return;
    isLocked = true;

    const isCorrect = (selectedChoice === currentQuestion.correctAnswer);
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach(b => {
        if (b.innerText === currentQuestion.correctAnswer) {
            b.classList.add('correct');
        } else if (b === btnElement && !isCorrect) {
            b.classList.add('wrong');
        }
    });

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
                    setTimeout(generateQuestion, 600);
                    isLocked = false;
                }
            });
        });
    }
}

function triggerPlayerAttack(callback) {
    const playerEl = document.getElementById('player');
    playSfx('critical');
    playerEl.style.transition = 'transform 0.2s';
    playerEl.style.transform = 'translateX(60px) scale(1.1)';
    setTimeout(() => {
        playerEl.style.transform = 'none';
        setTimeout(callback, 200);
    }, 200);
}

function triggerEnemyHit(callback) {
    const enemyEl = document.getElementById('enemy');
    playSfx('hit');
    enemyEl.classList.add('shake', 'hit-flash');
    setTimeout(() => {
        enemyEl.classList.remove('shake', 'hit-flash');
        callback();
    }, 400);
}

function triggerEnemyAttack(callback) {
    const enemyEl = document.getElementById('enemy');
    playSfx('hit');
    enemyEl.style.transition = 'transform 0.2s';
    enemyEl.style.transform = 'translateX(-60px) scale(1.1)';
    setTimeout(() => {
        enemyEl.style.transform = 'none';
        setTimeout(callback, 200);
    }, 200);
}

function triggerPlayerHit(callback) {
    const playerEl = document.getElementById('player');
    playerEl.classList.add('shake', 'hit-flash');
    setTimeout(() => {
        playerEl.classList.remove('shake', 'hit-flash');
        callback();
    }, 400);
}

function endBattle(isWin) {
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
            openMapScreen();
        }, 1000);
    } else {
        alert('敗北してしまった…！もう一度挑戦しよう！');
        openMapScreen();
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
