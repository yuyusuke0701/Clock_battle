/* ===================================================================
    画面サイズ対応：常に固定レイアウトを拡大縮小するだけにする
================================================================== */
function fitGame() {
    const container = document.getElementById('game-container');
    if (!container) return;
    const scale = Math.min(window.innerWidth / 480, window.innerHeight / 800);
    container.style.transform = 'scale(' + scale + ')';
}
window.addEventListener('resize', fitGame);
window.addEventListener('orientationchange', fitGame);

/* ===================================================================
    サウンド関連
================================================================== */
let soundOn = true;

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

const battleBgm = new Audio(encodeURI('Sounds/炎乱.mp3'));
const bossBgm = new Audio(encodeURI('Sounds/Battle_in_the_Moonlight.mp3'));

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
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.innerText = soundOn ? '🔊' : '🔇';
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
    "500kodama": { name: "５００こだまジンキフォーム", soubi: "ダイナミックギガスパナ", untenshi: "西大路 ヤマト" },
    "e5hayabusa": { name: "Ｅ５はやぶさトレーラーフォーム", soubi: "リクソウセイバー", untenshi: "大成 タイセイ" },
    "e6komachi": { name: "Ｅ６こまちトップリフターフォーム", soubi: "キンテイガン", untenshi: "フォールデンアカネ" },
    "e7kagayaki": { name: "Ｅ７かがやきドリルフォーム", soubi: "クッサクバンパー", untenshi: "九頭竜 リョータ" },
    "e8tsubasa": { name: "Ｅ８つばさドローンフォーム", soubi: "ホーネットライフル", untenshi: "最上 ガンマ" },
    "h5hayabusa": { name: "Ｈ５はやぶさドーザーフォーム", soubi: "ドーザーハイドアーム", untenshi: "五稜郭 シオン" },
    "n700skamome": { name: "Ｎ７００Ｓかもめフェリーフォーム", soubi: "サンドウカトラス", untenshi: "海風 ツクモ" },
    "n700snozomi": { name: "Ｎ７００Ｓのぞみブルートレーラーフォーム", soubi: "リクソウブレード", untenshi: "魚虎 テン" },
    "phantom": { name: "ファントムシンカリオン", soubi: "ファントムガントレットソード", untenshi: "大成 イナ" },
    "srg": { name: "シンカリオンＳＲＧ", soubi: "SRGリクソウセイバー", untenshi: "タイセイ・アカネ・リョータ" },
    "yellow": { name: "グレートドクターイエロー", soubi: "グレートケンソクブレード", untenshi: "梔子 モリト" },
    "zero": { name: "シンカリオン ０", soubi: "ゼロブレード", untenshi: "工部 レイジ" }
};

/* ===================================================================
    運転士ごとのバトルセリフ定義
================================================================== */
const PILOT_MESSAGES = {
    "500kodama": {
        start: "こだまの機動力を見せてやるぜ！",
        critical: "ダイナミックにいこうぜ！",
        win: "やったな！完璧なタイミングだ！",
        lose: "くそっ、時間合わせに遅れたか…！"
    },
    "e5hayabusa": {
        start: "よし、みんなの力を合わせて正確に合わせるぞ！",
        critical: "シンカリオンのパワー、全開だ！",
        win: "やったぜ！時間バッチリだね！",
        lose: "くそっ、時間合わせが間に合わなかったか…！"
    },
    "e6komachi": {
        start: "正確な時刻合わせね、任せてちょうだい！",
        critical: "一気に決めるわよ！",
        win: "当然の結果ね！お疲れさま！",
        lose: "嘘…時間がずれてしまったわ…"
    },
    "e7kagayaki": {
        start: "パワー全開で時計を合わせるぜ！",
        critical: "くらえ、渾身の一撃だ！",
        win: "っしゃあ！大勝利だぜ！",
        lose: "うおっ、タイミングが合わねえ…！"
    },
    "e8tsubasa": {
        start: "空中機動のように素早く合わせるよ！",
        critical: "ロックオン、完璧だ！",
        win: "勝ったね！いいペースだったよ！",
        lose: "ぐぬぬ、隙を突かれたか…"
    },
    "h5hayabusa": {
        start: "北の大地から、正確に時間を刻むわ！",
        critical: "冷徹に、確実に仕留める！",
        win: "作戦成功よ、お見事ね。",
        lose: "計算が狂ったというの…？"
    },
    "n700skamome": {
        start: "かもめのように軽快にいこう！",
        critical: "波に乗ってきたよ！",
        win: "大成功だね！やったぁ！",
        lose: "あわわ、時計の針が追いつかないよ…！"
    },
    "n700snozomi": {
        start: "のぞみのごとく、素早く正確に！",
        critical: "最高速度で突撃する！",
        win: "素晴らしい成果だね。",
        lose: "引き離されたか、悔しいな…！"
    },
    "yellow": {
        start: "ドクターイエローの検測、開始する！",
        critical: "完璧なデータだ、もらった！",
        win: "検測完了、異常なし！",
        lose: "データに誤差が生じたか…！"
    },
    "srg": {
        start: "3人の力を合わせれば、どんな時間も完璧だ！",
        critical: "トリプルパワー炸裂だ！",
        win: "やったぞ！最高のチームワークだ！",
        lose: "みんな、慌てず立て直すんだ…！"
    },
    "phantom": {
        start: "闇を切り裂き、時を支配する…！",
        critical: "消え去るがいい！",
        win: "我が勝利に曇りなし…！",
        lose: "この私が敗れるとは…許さんぞ！"
    },
    "zero": {
        start: "すべての原点、その力を見せよう。",
        critical: "零の衝撃を味わえ！",
        win: "これが原点の力だ。",
        lose: "まだ終わらんよ…"
    }
};

const PILOT_IMAGES = {
    "500kodama": "Images/CW/yamato_up.png",
    "e5hayabusa": "Images/CW/taisei_up.png",
    "e6komachi": "Images/CW/akane_up.png",
    "e7kagayaki": "Images/CW/ryota_up.png",
    "e8tsubasa": "Images/CW/ganma_up.png",
    "h5hayabusa": "Images/CW/shion_up.png",
    "n700skamome": "Images/CW/tsukumo_up.png",
    "n700snozomi": "Images/CW/ten_up.png",
    "srg": "Images/CW/3pilots.jpg",
    "yellow": "Images/CW/morito_up.png",
    "zero": "Images/CW/reiji_up.png"
};

const NORMAL_ENEMY_IMAGES_1_5 = [
    'Images/CW/敵1.png',
    'Images/CW/敵2.png',
    'Images/CW/敵3.png',
    'Images/CW/敵4.png',
    'Images/CW/敵5.png'
];

const NORMAL_ENEMY_IMAGES_6_10 = [
    'Images/CW/敵6.png',
    'Images/CW/敵7.png',
    'Images/CW/敵8.png',
    'Images/CW/敵9.png',
    'Images/CW/敵10.png'
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
================================================================== */
function showScreen(name) {
    const sTop = document.getElementById('screen-top');
    const sMap = document.getElementById('screen-map');
    const sBattle = document.getElementById('screen-battle');
    const mBtn = document.getElementById('menu-btn');

    if (sTop) sTop.style.display = name === 'top' ? 'flex' : 'none';
    if (sMap) sMap.style.display = name === 'map' ? 'block' : 'none';
    if (sBattle) sBattle.style.display = name === 'battle' ? 'block' : 'none';
    if (mBtn) mBtn.style.display = name === 'map' ? 'block' : 'none';
    currentScreen = name;
}

function startGame() {
    playSfx('decide');
    enterMap(true);
}

/* ===================================================================
    マップ画面
================================================================== */
function playStageIntro(stageId) {
    const intro = document.getElementById('stage-intro');
    const text = document.getElementById('stage-intro-text');
    if (!intro || !text) return;
    text.innerText = 'ステージ ' + stageId;
    intro.classList.remove('show');
    void intro.offsetWidth;
    intro.classList.add('show');
}

const STAGE_INTRO_DURATION_MS = 1000;

function enterMap(showIntro) {
    showScreen('map');
    renderMap();

    if (showIntro) {
        stopAllBgm();
        playStageIntro(currentStageId);
        clearTimeout(enterMap._bgmTimer);
        enterMap._bgmTimer = setTimeout(() => {
            playBgm('map', currentStageId);
        }, STAGE_INTRO_DURATION_MS);
    } else {
        playBgm('map', currentStageId);
    }

    progress.visitedStages[currentStageId] = true;
    saveProgress();
}

function showMapToast(text) {
    const t = document.getElementById('map-toast');
    if (!t) return;
    t.innerText = text;
    t.style.display = 'block';
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => { t.style.display = 'none'; }, 1800);
}

function renderMap() {
    const stage = STAGES[currentStageId - 1];
    const mapScreen = document.getElementById('screen-map');
    if (mapScreen && stage) {
        mapScreen.style.backgroundImage = "url('" + stage.bg + "')";
    }
    
    const navLabel = document.getElementById('stage-nav-label');
    if (navLabel) navLabel.innerText = 'ステージ ' + currentStageId;

    const prevArr = document.getElementById('prev-arrow');
    const nextArr = document.getElementById('next-arrow');
    if (prevArr) prevArr.classList.toggle('disabled', currentStageId <= 1);
    if (nextArr) nextArr.classList.toggle('disabled', currentStageId >= progress.unlockedStage);

    const clears = getStageClears(currentStageId);
    const container = document.getElementById('map-nodes');
    if (!container) return;
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
    enterMap(true);
}
function nextStage() {
    if (currentStageId >= progress.unlockedStage) return;
    playSfx('select');
    currentStageId++;
    enterMap(true);
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
    const titleEl = document.getElementById('node-popup-title');
    const popupEl = document.getElementById('node-popup');
    if (titleEl) titleEl.innerText = title + (clears[i] ? '（クリアずみ）' : '');
    if (popupEl) popupEl.style.display = 'flex';
}

function closeNodePopup() {
    playSfx('select');
    const popup = document.getElementById('node-popup');
    if (popup) popup.style.display = 'none';
}

function confirmBattleStart() {
    playSfx('decide');
    const popup = document.getElementById('node-popup');
    if (popup) popup.style.display = 'none';
    startBattle(pendingNodeIndex);
}

/* ===================================================================
    メニュー / しれいしつ ＆ プロフィール表示更新
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
    playSfx('decide');
    const menu = document.getElementById('menu-overlay');
    const shiri = document.getElementById('shireishitsu-overlay');
    if (menu) menu.style.display = 'none';
    renderShireishitsu();
    if (shiri) shiri.style.display = 'flex';
}
function closeShireishitsu() {
    playSfx('select');
    const shiri = document.getElementById('shireishitsu-overlay');
    if (shiri) shiri.style.display = 'none';
}

function updateCharacterPreview(charKey) {
    const profile = SHINKALION_PROFILES[charKey];
    const previewImg = document.getElementById('character-preview-img');
    const previewPilot = document.getElementById('character-preview-pilot');
    const previewName = document.getElementById('character-preview-name');
    const soubiEl = document.getElementById('profile-soubi');
    const untenshiEl = document.getElementById('profile-untenshi');

    const charDef = CHARACTERS.find(c => c.id === charKey) || CHARACTERS[0];

    if (previewImg) {
        previewImg.style.backgroundImage = "url('" + charDef.img + "')";
    }

    if (previewPilot) {
        const pilotImg = PILOT_IMAGES[charKey] || '';
        if (pilotImg) {
            previewPilot.style.backgroundImage = "url('" + pilotImg + "')";
            previewPilot.style.display = 'block';
        } else {
            previewPilot.style.display = 'none';
        }
    }

    if (profile) {
        if (previewName) previewName.innerText = profile.name;
        if (soubiEl) soubiEl.innerText = profile.soubi;
        if (untenshiEl) untenshiEl.innerText = profile.untenshi;
    } else {
        if (previewName) previewName.innerText = charDef.name;
        if (soubiEl) soubiEl.innerText = "—";
        if (untenshiEl) untenshiEl.innerText = "—";
    }
}

function renderShireishitsu() {
    const grid = document.getElementById('character-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CHARACTERS.forEach(c => {
        const card = document.createElement('div');
        card.className = 'character-face-card' + (progress.selectedCharacter === c.id ? ' selected' : '');
        
        card.innerHTML =
            '<div class="character-face-thumb" style="background-image:url(\'' + c.img + '\')"></div>' +
            '<div class="character-face-name">' + c.name + '</div>';

        card.onclick = () => {
            playSfx('select');
            progress.selectedCharacter = c.id;
            saveProgress();
            renderShireishitsu();
        };
        grid.appendChild(card);
    });

    updateCharacterPreview(progress.selectedCharacter);
}

/* ===================================================================
    バトル画面 ＆ 運転士吹き出し・クリティカル機能
================================================================== */
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

let criticalTimer = null;
let timeLeft = 10;
const MAX_TIME = 10;

function showPilotSpeech(type, durationMs = 3000) {
    const speechEl = document.getElementById('battle-pilot-speech');
    const faceEl = document.getElementById('battle-pilot-face');
    const bubbleEl = document.getElementById('battle-pilot-bubble');
    if (!speechEl || !faceEl || !bubbleEl) return;

    const charKey = progress.selectedCharacter;
    const pilotImg = PILOT_IMAGES[charKey] || '';
    const messages = PILOT_MESSAGES[charKey] || PILOT_MESSAGES['e5hayabusa'];
    const text = messages[type] || messages.start;

    faceEl.style.backgroundImage = "url('" + pilotImg + "')";
    faceEl.style.display = 'block';
    bubbleEl.innerText = text;

    speechEl.style.display = 'flex';
    speechEl.classList.add('show');
    clearTimeout(speechEl._hideTimer);
    
    if (durationMs > 0) {
        speechEl._hideTimer = setTimeout(() => {
            speechEl.classList.remove('show');
            speechEl.style.display = 'none';
        }, durationMs);
    }
}

function hidePilotSpeech() {
    const speechEl = document.getElementById('battle-pilot-speech');
    if (speechEl) {
        clearTimeout(speechEl._hideTimer);
        speechEl.classList.remove('show');
        speechEl.style.display = 'none';
    }
}

function startCriticalTimer() {
    clearInterval(criticalTimer);
    timeLeft = MAX_TIME;

    const bar = document.getElementById('critical-timer-bar');
    if (bar) {
        bar.style.transition = 'none';
        bar.style.transform = 'scaleX(1)';
    }

    setTimeout(() => {
        if (bar) {
            bar.style.transition = 'transform ' + MAX_TIME + 's linear';
            bar.style.transform = 'scaleX(0)';
        }
    }, 50);

    const startTime = Date.now();
    criticalTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        timeLeft = Math.max(0, MAX_TIME - elapsed);
        
        if (timeLeft <= 0) {
            clearInterval(criticalTimer);
        }
    }, 100);
}

function renderHP() {
    const playerBar = document.getElementById('player-hp');
    const enemyBar = document.getElementById('enemy-hp');

    if (playerBar) {
        playerBar.innerHTML = '';
        for (let i = 0; i < PLAYER_MAX_HP; i++) {
            const seg = document.createElement('div');
            seg.className = 'hp-seg player ' + (i < playerHP ? 'filled' : 'empty');
            playerBar.appendChild(seg);
        }
    }

    if (enemyBar) {
        enemyBar.innerHTML = '';
        for (let i = 0; i < enemyMaxHp; i++) {
            const seg = document.createElement('div');
            seg.className = 'hp-seg enemy ' + (i < enemyHP ? 'filled' : 'empty');
            enemyBar.appendChild(seg);
        }
    }
}

function flashHit(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add('hit-flash');
    setTimeout(() => el.classList.remove('hit-flash'), 300);
}

function shakeElement(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
}

function attackLunge(elementId, offsetPx) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.transform = 'translateX(' + offsetPx + 'px)';
    setTimeout(() => {
        el.style.transform = 'translateX(0)';
    }, 150);
}

function showMessage(text, duration) {
    const msg = document.getElementById('message-overlay');
    if (!msg) return;
    msg.innerText = text;
    msg.classList.remove('show');
    void msg.offsetWidth;
    msg.classList.add('show');
    clearTimeout(msg._hideTimer);
    msg._hideTimer = setTimeout(() => {
        msg.classList.remove('show');
    }, duration);
}

function drawClockHands(hour, minute) {
    const canvas = document.getElementById('handCanvas');
    if (!canvas) return;
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
    startCriticalTimer();
}

function changeHour(delta) {
    if (isLocked) return;
    playSfx('select');
    currentHour += delta;
    if (currentHour > 12) currentHour = 1;
    if (currentHour < 1) currentHour = 12;
    const hDisp = document.getElementById('hour-display');
    if (hDisp) hDisp.innerText = String(currentHour).padStart(2, '0');
}

function changeMinute() {
    if (isLocked) return;
    playSfx('select');
    currentMinute = currentMinute === 0 ? 30 : 0;
    const mDisp = document.getElementById('minute-display');
    if (mDisp) mDisp.innerText = String(currentMinute).padStart(2, '0');
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

/* ===================================================================
    ローディング画面の制御
================================================================== */
function showLoading(text) {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    if (textEl && text) {
        textEl.innerText = text;
    }
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/* ===================================================================
    バトル開始処理 ＆ 画像ローディング対応
================================================================== */
function startBattle(nodeIndex) {
    showLoading("バトルじゅんび中...");

    const isBoss = nodeIndex === 5;
    const stageDef = STAGES[currentStageId - 1];
    
    const charDef = CHARACTERS.find(c => c.id === progress.selectedCharacter) || CHARACTERS[0];
    const enemyImgPath = isBoss ? 'Images/CW/hades.png' : (currentStageId <= 5 ? NORMAL_ENEMY_IMAGES_1_5[0] : NORMAL_ENEMY_IMAGES_6_10[0]);
    const bgImgPath = stageDef.bg;

    let loadedCount = 0;
    const imagesToLoad = [charDef.img, enemyImgPath, bgImgPath];

    function checkAllImagesLoaded() {
        loadedCount++;
        if (loadedCount >= imagesToLoad.length) {
            executeActualBattleStart(nodeIndex);
            hideLoading();
        }
    }

    imagesToLoad.forEach(path => {
        const img = new Image();
        img.onload = checkAllImagesLoaded;
        img.onerror = checkAllImagesLoaded;
        img.src = path;
    });
}

function executeActualBattleStart(nodeIndex) {
    showScreen('battle');
    const isBoss = nodeIndex === 5;
    playBgm(isBoss ? 'boss' : 'battle');

    const stageDef = STAGES[currentStageId - 1];
    const battleScreen = document.getElementById('screen-battle');
    if (battleScreen && stageDef) {
        battleScreen.style.backgroundImage = "url('" + stageDef.bg + "')";
    }

    const playerEl = document.getElementById('player');
    const enemyEl = document.getElementById('enemy');

    if (playerEl) {
        playerEl.classList.remove('shake', 'hit-flash');
        playerEl.style.transform = 'none';
        const charDef = CHARACTERS.find(c => c.id === progress.selectedCharacter) || CHARACTERS[0];
        playerEl.style.backgroundImage = "url('" + charDef.img + "')";
    }

    if (enemyEl) {
        enemyEl.classList.remove('shake', 'hit-flash');
        if (isBoss) {
            enemyEl.style.backgroundImage = "url('Images/CW/hades.png')";
        } else {
            const enemyList = currentStageId <= 5 ? NORMAL_ENEMY_IMAGES_1_5 : NORMAL_ENEMY_IMAGES_6_10;
            const randomEnemy = enemyList[Math.floor(Math.random() * enemyList.length)];
            enemyEl.style.backgroundImage = "url('" + randomEnemy + "')";
        }
        enemyEl.style.display = 'block';
    }

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

    // バトル開始時の意気込みコメントを表示
    showPilotSpeech('start', 3500);
}

function backToMap() {
    if (isLocked) return;
    playSfx('select');
    hidePilotSpeech();
    enterMap(false);
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
    clearInterval(criticalTimer);

    const isCritical = timeLeft > 0;
    const damage = isCritical ? 2 : 1;

    if (isCritical) {
        showPilotSpeech('critical', 2500);
        showCriticalCutin(() => {
            executeAttackAfterCutin(damage);
        });
    } else {
        executeAttackAfterCutin(damage);
    }
}

function showCriticalCutin(callback) {
    const cutin = document.getElementById('critical-cutin');
    
    if (cutin) {
        const charDef = CHARACTERS.find(c => c.id === progress.selectedCharacter) || CHARACTERS[0];
        const imgEl = document.getElementById('critical-cutin-image');
        if (imgEl) {
            imgEl.style.backgroundImage = "url('" + charDef.img + "')";
        }

        cutin.classList.add('show');
        playSfx('critical');

        setTimeout(() => {
            cutin.classList.remove('show');
            if (callback) callback();
        }, 1000);
    } else {
        if (callback) callback();
    }
}

function executeAttackAfterCutin(damage) {
    attackLunge('player', 40);

    setTimeout(() => {
        enemyHP = Math.max(0, enemyHP - damage);
        renderHP();
        flashHit('enemy');
        shakeElement('enemy');

        const isFinishingBlow = enemyHP <= 0;
        playSfx(isFinishingBlow ? 'wrong' : 'hit');

        if (!isFinishingBlow) {
            const dmgText = damage === 2 ? "クリティカル！\nてきに 2のダメージ！" : "てきは 1のダメージ！";
            showMessage(dmgText, 900);
            isLocked = true;
            setTimeout(() => {
                generateQuestion();
                isLocked = false;
            }, 900);
            return;
        }

        // 勝利時
        isLocked = true;
        playSfx('correct');
        score++;
        const scoreText = document.getElementById('score-text');
        if (scoreText) scoreText.innerText = "たおしたてき: " + score;

        showPilotSpeech('win', 2500);
        showMessage("てきを たおした！", 2000);

        const enemy = document.getElementById('enemy');
        const player = document.getElementById('player');

        let hops = 0;
        const hopAnim = setInterval(() => {
            hops++;
            if (player) player.style.transform = "translateY(" + (hops % 2 === 1 ? -14 : 0) + "px)";
            if (hops >= 6) {
                clearInterval(hopAnim);
                if (player) player.style.transform = "none";
                if (enemy) enemy.style.display = "none";
            }
        }, 130);

        setTimeout(() => {
            if (player) player.style.transform = "none";
            onNodeCleared();
            hidePilotSpeech();
            enterMap(true);
            isLocked = false;
        }, 2000);
    }, 150);
}

function handleWrong() {
    clearInterval(criticalTimer);

    attackLunge('enemy', -40);

    setTimeout(() => {
        playerHP = Math.max(0, playerHP - 1);
        renderHP();
        flashHit('player');
        shakeElement('player');

        const isFinishingBlow = playerHP <= 0;
        playSfx(isFinishingBlow ? 'wrong' : 'hit');

        if (!isFinishingBlow) {
            showMessage("みかたは 1のダメージ！", 900);
            isLocked = true;
            setTimeout(() => { 
                generateQuestion();
                isLocked = false; 
            }, 900);
            return;
        }

        // 敗北時
        isLocked = true;
        showPilotSpeech('lose', 2500);
        showMessage("ゲームオーバー！", 1800);
        setTimeout(() => {
            hidePilotSpeech();
            enterMap(true);
            isLocked = false;
        }, 1800);
    }, 150);
}

/* ===================================================================
    初期化
================================================================== */
window.onload = function() {
    fitGame();
    showScreen('top');
};
