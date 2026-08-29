window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const profiles = {
        minjun: { id: 'minjun', name: '민준', role: '안정형 조제 베테랑', maxHp: 120, speed: 276, damage: 11, fireRate: 0.85, heal: 35, quote: '침착하게. 처방전부터 확인하겠습니다.' },
        seoyeon: { id: 'seoyeon', name: '서연', role: '기동형 빠른 판단가', maxHp: 95, speed: 324, damage: 9, fireRate: 0.65, heal: 28, quote: '다음 분, 증상부터 말씀해 주세요.' }
    };
    let selectedProfile = profiles.minjun;

    function resize() {
        const viewport = window.visualViewport;
        canvas.width = Math.round(viewport?.width || window.innerWidth);
        canvas.height = Math.round(viewport?.height || window.innerHeight);
    }

    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 150));
    resize();

    let game = null;
    const hpUi = document.getElementById('hp-bar');
    const levelUi = document.getElementById('level-bar');
    const skillUi = document.getElementById('skill-bar');
    const staffDialog = document.getElementById('staff-dialog');
    const staffDialogText = document.getElementById('staff-dialog-text');
    let staffDialogTimer;
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.addEventListener('click', async () => {
        const muted = await window.gameAudio.toggleMute();
        soundToggle.dataset.audioState = window.gameAudio.ctx?.state || 'unavailable';
        soundToggle.setAttribute('aria-pressed', String(muted));
        soundToggle.textContent = muted ? '🔇 음향 꺼짐' : '🔊 음향 켜짐';
    });

    window.showStaffDialog = (text) => {
        clearTimeout(staffDialogTimer);
        staffDialogText.textContent = text;
        staffDialog.style.display = 'block';
        staffDialogTimer = setTimeout(() => { staffDialog.style.display = 'none'; }, 3500);
    };
    const gameOverUi = document.getElementById('game-over');
    const pauseModal = document.getElementById('pause-modal');
    const resumeButton = document.getElementById('resume-button');
    const quitButton = document.getElementById('quit-button');
    const shopModal = document.getElementById('shop-modal');
    const shopContainer = document.getElementById('shop-container');
    const shopCash = document.getElementById('shop-cash');
    const shopSummary = document.getElementById('shop-summary');
    const shopContinue = document.getElementById('shop-continue');
    const endingModal = document.getElementById('ending-modal');
    let pauseMenuOpen = false;
    let gameOverSoundPlayed = false;

    const setPauseMenu = (open) => {
        if (!game) return;
        pauseMenuOpen = open;
        game.isPaused = open;
        window.gameAudio.setPaused(open);
        pauseModal.style.display = open ? 'block' : 'none';
    };

    window.addEventListener('keydown', (event) => {
        if (!game || event.key !== 'Escape' || game.isGameOver || upgradeModal.style.display === 'block') return;
        event.preventDefault();
        setPauseMenu(!pauseMenuOpen);
    });
    resumeButton.onclick = () => setPauseMenu(false);
    quitButton.onclick = () => {
        if (!game) return;
        game.isGameOver = true;
        pauseModal.style.display = 'none';
    };

    const renderShop = (notice = '') => {
        if (!game) return;
        shopCash.textContent = `보유 현금 ${game.cash.toLocaleString()}원`;
        if (notice) shopSummary.textContent = notice;
        shopContainer.innerHTML = '';
        const categories = [...new Set(game.getShopItems().map(item => item.category))];
        categories.forEach(category => {
            const section = document.createElement('section');
            section.className = 'shop-category';
            section.innerHTML = `<h2>${category}</h2>`;
            const grid = document.createElement('div');
            grid.className = 'shop-grid';
            game.getShopItems().filter(item => item.category === category).forEach(item => {
                const button = document.createElement('button');
                button.className = 'shop-item';
                button.disabled = item.soldOut || item.locked;
                button.innerHTML = `<strong>${item.name}</strong><span>${item.desc}</span><b>${item.soldOut ? '구매 완료' : item.locked ? item.lockText : `${item.price.toLocaleString()}원`}</b>`;
                button.onclick = () => {
                    const result = game.purchaseShopItem(item.id);
                    renderShop(result.message);
                };
                grid.appendChild(button);
            });
            section.appendChild(grid);
            shopContainer.appendChild(section);
        });
    };

    window.openStageShop = (activeGame, clearedStage) => {
        if (activeGame !== game) return;
        shopSummary.textContent = `STAGE ${clearedStage} 정산 완료 · 체력을 회복하거나 약국을 키워 다음 근무를 준비하세요.`;
        shopModal.style.display = 'block';
        renderShop();
    };

    shopContinue.onclick = () => {
        if (!game) return;
        shopModal.style.display = 'none';
        game.finishShopping();
        window.showStaffDialog(`약국 ${game.pharmacyLevel}단계 · 다음 야간 근무를 시작합니다!`);
    };

    window.showGameEnding = (activeGame) => {
        shopModal.style.display = 'none';
        endingModal.style.display = 'grid';
        document.getElementById('ending-score').textContent = `최종 기록 · STAGE ${activeGame.stage} · 약국 ${activeGame.pharmacyLevel}단계`;
    };
    document.getElementById('ending-restart').onclick = () => location.reload();

    const touchSkill = document.getElementById('touch-skill');
    touchSkill.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (game) game.fireEmergencyPrescription();
    });

    // 업그레이드 UI 관련
    const upgradeModal = document.getElementById('upgrade-modal');
    const upgradeContainer = document.getElementById('upgrade-container');

    const UPGRADES = [
        { title: "영양제 투여", desc: "최대 체력 20 증가 및 완전 회복", apply: (player, game) => { player.maxHp += 20; player.hp = player.maxHp; } },
        { title: "드링크제 각성", desc: "이동 속도 15 증가", apply: (player, game) => { player.speed += 15; } },
        { title: "약사의 손놀림", desc: "알약 투척 속도 증가", apply: (player, game) => { player.fireRate = Math.max(0.02, player.fireRate * 0.85); } },
        { title: "처방전 강화", desc: "알약 데미지 5 증가", apply: (player, game) => { game.baseDamage += 5; } },
        { title: "대용량 포장", desc: "알약 크기(판정) 증가", apply: (player, game) => { game.baseProjRadius += 3; } }
    ];

    window.onLevelUp = () => {
        window.gameAudio.levelUp();
        // 무작위 3개 추출
        const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        upgradeContainer.innerHTML = '';
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.innerHTML = `<div class="upgrade-btn-title">${choice.title}</div><div class="upgrade-btn-desc">${choice.desc}</div>`;
            btn.onclick = () => {
                choice.apply(game.player, game);
                upgradeModal.style.display = 'none';
                game.isPaused = false;

                // 만약 경험치가 남아있다면 연속 레벨업
                if (game.exp >= game.level * 100) {
                    game.addExp(0);
                }
            };
            upgradeContainer.appendChild(btn);
        });

        upgradeModal.style.display = 'block';
    }

    function gameLoop(timestamp) {
        if (!game) return;
        if (game.isGameOver) {
            if (!gameOverSoundPlayed) {
                gameOverSoundPlayed = true;
                window.gameAudio.gameOver();
            }
            document.getElementById('game-over-score').textContent = `${selectedProfile.name} 약사 · Lv ${game.level} · STAGE ${game.stage}`;
            gameOverUi.style.display = 'block';
            return;
        }

        if (game.width !== canvas.width || game.height !== canvas.height) {
            game.updateSize(canvas.width, canvas.height);
        }

        game.update(timestamp);
        game.draw();

        // UI 업데이트
        document.getElementById('character-bar').innerText = `${selectedProfile.name} · 약국 ${game.pharmacyLevel}단계 · ${game.cash.toLocaleString()}원`;
        hpUi.innerText = `HP  ${Math.ceil(Math.max(0, game.player.hp))} / ${game.player.maxHp}`;
        levelUi.innerText = game.bossActive
            ? `STAGE ${game.stage} · 중간보스 교전 중 | Lv: ${game.level}`
            : `STAGE ${game.stage} · ${game.stageKills}/${game.stageTarget} 처치 | Lv: ${game.level} (Exp: ${game.exp} / ${game.level * 100})`;
        skillUi.innerText = game.novaCooldown > 0
            ? `시럽투척 충전 중  ${game.novaCooldown.toFixed(1)}초`
            : `시럽투척: 사용 가능 (Q)`;
        touchSkill.classList.toggle('ready', game.novaCooldown <= 0);
        touchSkill.querySelector('span').textContent = game.novaCooldown > 0 ? `${game.novaCooldown.toFixed(1)}초` : '시럽투척';

        requestAnimationFrame(gameLoop);
    }

    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedProfile = profiles[card.dataset.character];
            document.querySelectorAll('.character-card').forEach(item => item.classList.toggle('selected', item === card));
            document.getElementById('character-quote').textContent = `“${selectedProfile.quote}”`;
        });
    });
    document.getElementById('start-button').addEventListener('click', () => {
        window.gameAudio.start().then((running) => {
            soundToggle.dataset.audioState = running ? 'running' : 'blocked';
            if (!running) soundToggle.textContent = '🔈 소리 시작';
        });
        window.gameAudio.setPaused(false);
        gameOverSoundPlayed = false;
        game = new Game(canvas, selectedProfile);
        if (new URLSearchParams(location.search).has('test')) {
            game.cash = 4000000;
            game.stageTarget = 1;
            game.baseDamage = 250;
            game.novaCooldown = 0;
        }
        document.getElementById('start-screen').style.display = 'none';
        window.showStaffDialog(`${selectedProfile.name} 약사님, 야간 근무를 시작합니다. 시럽투척이 충전되면 Q로 사용하세요!`);
        requestAnimationFrame(gameLoop);
    });
};
