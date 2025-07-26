// DOM要素の取得
const phaseText = document.getElementById('phase-text');
const clickOverlay = document.querySelector('.click-overlay'); 
const point = document.querySelector('.point'); 
const animationArea = document.querySelector('.animation-area'); 
const pointContainer = document.querySelector('.point-container'); // point-container も取得！

// 呼吸フェーズの定義 (変更なし)
const phases = [
    { name: 'INHALE', duration: 4, action: 'inhale' }, 
    { name: 'HOLD', duration: 4, action: 'hold-top' },   
    { name: 'EXHALE', duration: 4, action: 'exhale' },   
    { name: 'HOLD', duration: 4, action: 'hold-bottom' } 
];

let currentPhaseIndex = 0;
let isRunning = false; 
let isPausedRequested = false; 
let animationTimeoutId; 
let resumeButtonTimeoutId; 

// アニメーションの制御定数
const initialSquareSize = 300; 
const pointSize = 20; 
const borderThickness = 2; // 正方形の縁の太さ (2pxのまま)

// 実際に描画される正方形 (borderを含む) の全体のサイズ
// これはanimationAreaの論理的なサイズであり、pointの軌跡の基準点となる
const visualSquareSize = initialSquareSize; // 300pxのまま

// 光点の半径 (これを使って光点の中心を線に合わせる)
const pointRadius = pointSize / 2; // 10px

// point-container のサイズ計算: 縁 + 光点の直径分だけ外側に広げる
// (borderThickness * 2) は正方形の上下左右のborderの合計
// (pointSize) は光点の直径分
const expandedContainerSize = visualSquareSize + (borderThickness * 2);

// expandedContainerSize が visualSquareSize と中央で重なるためのオフセット
// point-container が visualSquareSize の親要素のように振る舞うため、
// point-container の top/left は負の値になる
const containerOffset = -(borderThickness); // 縁の分だけ外側に出す

/**
 * アニメーションを初期状態にリセットする関数
 */
function resetAnimationToStart() {
    console.log("resetAnimationToStart called.");
    clearInterval(animationTimeoutId); 
    clearTimeout(resumeButtonTimeoutId); 

    isRunning = false;
    isPausedRequested = false; 
    currentPhaseIndex = 0;
    phaseText.textContent = '▶'; 

    // animation-area (縁の正方形) のサイズと位置を更新
    animationArea.style.width = `${visualSquareSize}px`;
    animationArea.style.height = `${visualSquareSize}px`;
    animationArea.style.top = `0px`;
    animationArea.style.left = `0px`;
    animationArea.style.position = 'relative'; 

    // point-container (光点の軌跡となる親要素) のサイズと位置を設定
    pointContainer.style.width = `${expandedContainerSize}px`;
    pointContainer.style.height = `${expandedContainerSize}px`;
    pointContainer.style.top = `${containerOffset}px`;
    pointContainer.style.left = `${containerOffset}px`;
    pointContainer.style.position = 'absolute';
    
    // 光点を初期位置（左下）に瞬間的に戻す
    point.style.transition = 'none'; 
    // calculateArrowPosition('hold-bottom') が返す値と完全に一致させる
    const initialPosition = calculateArrowPosition('hold-bottom');
    point.style.left = initialPosition.left;
    point.style.top = initialPosition.top;
    
    // 強制的にリフローを発生させ、transition: noneが適用されるのを待つ 
    // eslint-disable-next-line no-unused-vars
    const reflow = point.offsetWidth; 

    // 次のアニメーションのためにtransitionを元の状態に戻す 
    point.style.transition = `left ${phases[currentPhaseIndex].duration}s linear, top ${phases[currentPhaseIndex].duration}s linear`;
}

/**
 * 光点の位置を計算する関数
 * @param {string} action - 現在のフェーズのアクション
 * @returns {{left: string, top: string}} - 移動先のCSSプロパティ
 */
function calculateArrowPosition(action) {
    let targetLeft = 0;
    let targetTop = 0;

    switch (action) {
        case 'inhale': // 左下から左上へ
            targetLeft = borderThickness - pointRadius; 
            targetTop = borderThickness - pointRadius; 
            break;
        case 'hold-top': // 左上から右上へ
            targetLeft = visualSquareSize + borderThickness - pointRadius; 
            targetTop = borderThickness - pointRadius; 
            break;
        case 'exhale': // 右上から右下へ
            targetLeft = visualSquareSize + borderThickness - pointRadius; 
            targetTop = visualSquareSize + borderThickness - pointRadius; 
            break;
        case 'hold-bottom': // 右下から左下へ
            targetLeft = borderThickness - pointRadius; 
            targetTop = visualSquareSize + borderThickness - pointRadius; 
            break;
    }
    return { left: `${targetLeft}px`, top: `${targetTop}px` };
}

/**
 * 各フェーズのアニメーションを開始/続行する関数
 */
function startPhaseAnimation(durationOverride = phases[currentPhaseIndex].duration) {
    if (!isRunning) {
        console.log("Animation is not running, so not starting new phase animation.");
        return; 
    }

    const currentPhase = phases[currentPhaseIndex];
    phaseText.textContent = currentPhase.name; // ここは name をそのまま表示

    const targetPosition = calculateArrowPosition(currentPhase.action);

    point.style.transition = `left ${durationOverride}s linear, top ${durationOverride}s linear`;
    point.style.left = targetPosition.left;
    point.style.top = targetPosition.top;

    animationTimeoutId = setTimeout(() => {
        if (isPausedRequested) {
            console.log(`Phase '${currentPhase.name}' completed. Now stopping animation.`);
            isRunning = false; 
            
            const finalLeft = window.getComputedStyle(point).left;
            const finalTop = window.getComputedStyle(point).top;
            point.style.transition = 'none';
            point.style.left = finalLeft;
            point.style.top = finalTop;
            const reflow = point.offsetWidth;
            
            currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
            console.log(`Ready to resume from next phase: ${phases[currentPhaseIndex].name}`);

            resumeButtonTimeoutId = setTimeout(() => {
                phaseText.textContent = '▶'; 
                isPausedRequested = false; 
                console.log("Displayed '▶' after 1 seconds pause.");
            }, 1000); 

        } else {
            currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
            startPhaseAnimation(); 
        }
    }, durationOverride * 1000);
    console.log(`Starting phase: ${currentPhase.name}, Duration: ${durationOverride}s`);
}

/**
 * 呼吸アニメーションを開始する関数
 */
function startBreathing() {
    console.log("startBreathing called. isRunning:", isRunning);
    if (isRunning) {
        console.log("Already running, ignoring startBreathing call.");
        return;
    }

    isRunning = true; 
    isPausedRequested = false; 

    if (currentPhaseIndex === 0 && !isPausedRequested) { 
        resetAnimationToStart(); 
    } else {
        // eslint-disable-next-line no-unused-vars
        const reflow = point.offsetWidth;
        point.style.transition = `left ${phases[currentPhaseIndex].duration}s linear, top ${phases[currentPhaseIndex].duration}s linear`;
    }

    console.log("Starting initial/resumed phase animation.");
    startPhaseAnimation();
}

/**
 * 呼吸アニメーションを一時停止する要求を出す関数 (変更なし)
 */
function requestPause() {
    console.log("requestPause called.");
    if (!isRunning) return; 

    isPausedRequested = true; 
    phaseText.textContent = '⏸'; 

    clearTimeout(resumeButtonTimeoutId); 

    console.log("Pause requested. Animation will stop after current phase completes.");
}

/**
 * 呼吸アニメーションを再開する関数 (変更なし)
 */
function resumeAnimation() {
    console.log("resumeAnimation called.");
    if (isRunning) return; 

    isRunning = true; 
    isPausedRequested = false; 

    clearTimeout(resumeButtonTimeoutId); 

    console.log(`Resuming from phase: ${phases[currentPhaseIndex].name}`);
    startPhaseAnimation();
}


/**
 * 呼吸アニメーションをトグルする関数 (クリックイベント用) (変更なし)
 */
function toggleBreathing() {
    console.log("toggleBreathing called. Current isRunning:", isRunning, "isPausedRequested:", isPausedRequested);
    if (isRunning) {
        requestPause();
        console.log("Toggling to pause request.");
    } else {
        resumeAnimation(); 
        console.log("Toggling to resume.");
    }
}

/**
 * イベントリスナーの登録 (変更なし)
 */
if (clickOverlay) { 
    clickOverlay.addEventListener('click', toggleBreathing);
    console.log("Event listener attached to clickOverlay."); 
} else {
    console.error("Error: .click-overlay element not found in the DOM."); 
}

// ページロード時にアプリを初期状態にリセット 
resetAnimationToStart();