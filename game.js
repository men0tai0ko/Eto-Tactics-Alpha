'use strict';

// ===== ELEMENT SYSTEM =====
const ELEMENTS = {
  fire:      { name: '火', color: '#ff4400', emoji: '🔥' },
  water:     { name: '水', color: '#2288ff', emoji: '💧' },
  wood:      { name: '木', color: '#22cc44', emoji: '🌿' },
  metal:     { name: '金', color: '#d4a017', emoji: '⚔️' },
  earth:     { name: '土', color: '#c0845a', emoji: '🪨' },
  dark:      { name: '闇', color: '#aa00ff', emoji: '🌑' },
  lightning: { name: '雷', color: '#ffff00', emoji: '⚡' },
  none:      { name: '無', color: '#aaaaaa', emoji: '○' },
};

// Elemental advantage matrix: attacker -> [advantaged against, disadvantaged against]
const AFFINITIES = {
  fire:      { strong: ['wood','metal'],   weak: ['water','earth'] },
  water:     { strong: ['fire','earth'],   weak: ['wood','lightning'] },
  wood:      { strong: ['earth','water'],  weak: ['fire','metal'] },
  metal:     { strong: ['wood','lightning'],weak: ['fire','earth'] },
  earth:     { strong: ['water','lightning'],weak: ['wood','metal'] },
  dark:      { strong: ['lightning','none'],weak: ['fire','metal'] },
  lightning: { strong: ['water','dark'],   weak: ['earth','wood'] },
  none:      { strong: [],                 weak: [] },
};

function getElementMult(atkElem, defElem) {
  if (!AFFINITIES[atkElem]) return 1.0;
  if (AFFINITIES[atkElem].strong.includes(defElem)) return 1.5;
  if (AFFINITIES[atkElem].weak.includes(defElem)) return 0.7;
  return 1.0;
}

// ===== DAN (段) SYSTEM =====
// Dan multiplies CP threshold; higher dan = more powerful but builds slower
function danMultiplier(dan) {
  return 1 + (dan - 1) * 0.25; // dan1=1.0x, dan2=1.25x, dan3=1.5x, dan4=1.75x, dan5=2.0x
}

function calcCP(baseCP, dan) {
  return Math.floor(baseCP * danMultiplier(dan));
}

// ===== SKILL DEFINITIONS =====
const SKILLS = {
  // Player skills
  flame_fang: {
    id: 'flame_fang', name: '炎牙', icon: '🔥', element: 'fire',
    ppCost: 8, power: 65, type: 'attack',
    desc: '炎を纏った強烈な一撃。火属性の相手に特効。',
    dan: 1,
    effect: null,
  },
  inferno_rush: {
    id: 'inferno_rush', name: '獄炎突進', icon: '💥', element: 'fire',
    ppCost: 15, power: 110, type: 'attack',
    desc: '炎を纏い、高速で敵へ突進する。クリット率高め。',
    dan: 2,
    critBoost: 0.2,
    effect: null,
  },
  flare_heal: {
    id: 'flare_heal', name: 'フレアヒール', icon: '✨', element: 'fire',
    ppCost: 10, power: 0, type: 'heal',
    desc: '炎の力でHPを回復する。段数が高いほど効果大。',
    dan: 1,
    healAmt: 80,
    effect: null,
  },
  shadow_bind: {
    id: 'shadow_bind', name: '影縫い', icon: '🕷️', element: 'dark',
    ppCost: 12, power: 40, type: 'attack',
    desc: '影で相手を縛り付け、行動を制限する。',
    dan: 1,
    statusChance: 0.6, statusEffect: 'bind',
    effect: null,
  },
  fox_fire: {
    id: 'fox_fire', name: '狐火', icon: '🦊', element: 'fire',
    ppCost: 5, power: 35, type: 'attack',
    desc: '青白い狐火を放つ。低コストの基本攻撃。',
    dan: 1,
    effect: null,
  },
  eto_surge: {
    id: 'eto_surge', name: '干支解放', icon: '☯️', element: 'fire',
    ppCost: 25, power: 160, type: 'attack',
    desc: '干支の力を解放し、全力で攻撃する。段数UP効果。',
    dan: 3,
    selfStatus: 'dan_up',
    effect: null,
  },

  // Enemy skills
  thunder_bolt: {
    id: 'thunder_bolt', name: '雷撃', icon: '⚡', element: 'lightning',
    ppCost: 12, power: 80, type: 'attack',
    desc: '天から雷を呼び、敵を撃つ。スタン効果あり。',
    dan: 1,
    statusChance: 0.35, statusEffect: 'stun',
    effect: null,
  },
  golden_shield: {
    id: 'golden_shield', name: '黄金盾', icon: '🛡️', element: 'metal',
    ppCost: 10, power: 0, type: 'buff',
    desc: '黄金の盾で身を守る。次の攻撃を軽減する。',
    dan: 1,
    selfStatus: 'shield',
    effect: null,
  },
  divine_smite: {
    id: 'divine_smite', name: '神聖打', icon: '✦', element: 'lightning',
    ppCost: 18, power: 120, type: 'attack',
    desc: '神聖な力を持つ強打。クリット時に追加効果。',
    dan: 2,
    critBoost: 0.15,
    effect: null,
  },
  regen_aura: {
    id: 'regen_aura', name: '再生の光', icon: '💛', element: 'metal',
    ppCost: 8, power: 0, type: 'heal',
    desc: '金属の力で体を修復する。持続回復を付与。',
    dan: 1,
    selfStatus: 'regen',
    healAmt: 40,
    effect: null,
  },
  lightning_strike: {
    id: 'lightning_strike', name: '雷電掌', icon: '🌩️', element: 'lightning',
    ppCost: 8, power: 55, type: 'attack',
    desc: '拳に雷を宿し、素早く打つ。',
    dan: 1,
    effect: null,
  },
};

// ===== ITEMS =====
const ITEMS_DATA = [
  { id: 'potion',     name: '回復薬',   icon: '🧪', count: 3, desc: 'HPを120回復',   use: { type: 'heal', amt: 120 } },
  { id: 'ether',      name: 'エーテル', icon: '💙', count: 2, desc: 'PPを30回復',    use: { type: 'pp', amt: 30 } },
  { id: 'antidote',   name: '解毒薬',   icon: '💚', count: 2, desc: '状態異常を回復', use: { type: 'cure' } },
  { id: 'dan_stone',  name: '段石',     icon: '💎', count: 1, desc: '段数を1上げる',  use: { type: 'dan' } },
];

// ===== STANCES (for change command) =====
const STANCES = [
  { id: 'attack',  name: '攻撃態勢', icon: '⚔️', desc: '攻撃力+20%, 防御-10%', atkMod: 1.2, defMod: 0.9 },
  { id: 'defense', name: '防御態勢', icon: '🛡️', desc: '防御力+20%, 攻撃-10%', atkMod: 0.9, defMod: 1.2 },
  { id: 'balance', name: 'バランス', icon: '⚖️', desc: '攻防バランス型 (標準)', atkMod: 1.0, defMod: 1.0 },
  { id: 'agile',   name: '敏捷態勢', icon: '💨', desc: '速度+25%, 攻防-5%', atkMod: 0.95, defMod: 0.95, spdMod: 1.25 },
];

// ===== CHARACTER CLASS =====
class Character {
  constructor(cfg) {
    this.id       = cfg.id;
    this.name     = cfg.name;
    this.level    = cfg.level;
    this.element  = cfg.element;
    this.isPlayer = cfg.isPlayer;

    this.maxHp    = cfg.maxHp;
    this.hp       = cfg.hp ?? cfg.maxHp;
    this.maxPp    = cfg.maxPp;
    this.pp       = cfg.pp ?? cfg.maxPp;
    this.baseCP   = cfg.baseCP;
    this.dan      = cfg.dan ?? 1;

    this.atk      = cfg.atk;
    this.def      = cfg.def;
    this.spd      = cfg.spd;
    this.crit     = cfg.crit ?? 0.1;

    this.exp      = cfg.exp ?? 0;
    this.expNext  = cfg.expNext ?? 4500;

    this.skills   = cfg.skills.map(id => SKILLS[id]).filter(Boolean);
    this.items    = cfg.isPlayer ? ITEMS_DATA.map(i => ({ ...i })) : [];

    this.statusEffects = {}; // { burn: 3, stun: 1, ... }
    this.stance = 'balance';
    this.atkMod = 1.0;
    this.defMod = 1.0;
    this.spdMod = 1.0;

    this.shields = 0;
  }

  get cp() { return calcCP(this.baseCP, this.dan); }
  get isAlive() { return this.hp > 0; }

  applyStatus(status, turns = 3) {
    this.statusEffects[status] = turns;
  }

  hasStatus(status) {
    return (this.statusEffects[status] ?? 0) > 0;
  }

  tickStatus() {
    const expired = [];
    for (const [k, v] of Object.entries(this.statusEffects)) {
      this.statusEffects[k] = v - 1;
      if (this.statusEffects[k] <= 0) expired.push(k);
    }
    expired.forEach(k => delete this.statusEffects[k]);
    return expired;
  }

  clearStatuses() {
    this.statusEffects = {};
  }

  setStance(stanceId) {
    const s = STANCES.find(x => x.id === stanceId);
    if (!s) return;
    this.stance = stanceId;
    this.atkMod = s.atkMod;
    this.defMod = s.defMod;
    this.spdMod = s.spdMod ?? 1.0;
  }

  effectiveSpd() {
    return Math.floor(this.spd * this.spdMod * (this.hasStatus('bind') ? 0.6 : 1));
  }

  takeDamage(dmg) {
    if (this.shields > 0) {
      const absorbed = Math.min(this.shields, dmg);
      this.shields -= absorbed;
      dmg -= absorbed;
    }
    this.hp = Math.max(0, this.hp - dmg);
    return dmg;
  }

  heal(amt) {
    const actual = Math.min(amt, this.maxHp - this.hp);
    this.hp = Math.min(this.maxHp, this.hp + amt);
    return actual;
  }

  recoverPP(amt) {
    const actual = Math.min(amt, this.maxPp - this.pp);
    this.pp = Math.min(this.maxPp, this.pp + amt);
    return actual;
  }

  gainExp(amt) {
    this.exp += amt;
    if (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.level++;
      this.expNext = Math.floor(this.expNext * 1.2);
      this.maxHp += 20;
      this.hp = Math.min(this.hp + 20, this.maxHp);
      this.atk += 3;
      this.def += 2;
      this.baseCP += 30;
      return true;
    }
    return false;
  }
}

// ===== BATTLE SYSTEM =====
class BattleEngine {
  constructor(player, enemy) {
    this.player = player;
    this.enemy  = enemy;
    this.turnCount = 0;
    this.timeline  = [];
    this.buildTimeline();
  }

  buildTimeline() {
    // Simple timeline: 4 upcoming actions based on speed
    this.timeline = [];
    let pTick = 0, eTick = 0;
    const pSpd = this.player.effectiveSpd();
    const eSpd = this.enemy.effectiveSpd();
    for (let i = 0; i < 6; i++) {
      if (pTick <= eTick) {
        this.timeline.push({ who: 'player', tick: pTick });
        pTick += Math.floor(100 / pSpd);
      } else {
        this.timeline.push({ who: 'enemy', tick: eTick });
        eTick += Math.floor(100 / eSpd);
      }
    }
  }

  calcDamage(attacker, defender, skill) {
    const base    = skill.power;
    const atkStat = Math.floor(attacker.atk * attacker.atkMod * danMultiplier(attacker.dan));
    const defStat = Math.floor(defender.def * defender.defMod);
    const elemMul = getElementMult(skill.element, defender.element);

    // Damage formula: base * (atkStat / defStat) * elem * variance
    const variance = 0.9 + Math.random() * 0.2;
    let dmg = Math.floor(base * (atkStat / Math.max(defStat, 1)) * elemMul * variance);

    // Critical
    const critRate = (attacker.crit + (skill.critBoost ?? 0));
    const isCrit   = Math.random() < critRate;
    if (isCrit) dmg = Math.floor(dmg * 1.8);

    return { dmg, isCrit, elemMul };
  }

  executeSkill(attacker, defender, skill) {
    const result = { attacker, defender, skill, events: [] };

    if (attacker.pp < skill.ppCost) {
      result.events.push({ type: 'no_pp' });
      return result;
    }

    // [Fix1] Check stun BEFORE deducting PP so stunned turns don't waste resources
    if (attacker.hasStatus('stun')) {
      result.events.push({ type: 'stunned' });
      return result;
    }

    attacker.pp -= skill.ppCost;

    if (skill.type === 'attack') {
      const hitChance = attacker.hasStatus('bind') ? 0.75 : 1.0;
      if (Math.random() > hitChance) {
        result.events.push({ type: 'miss' });
        return result;
      }
      const { dmg, isCrit, elemMul } = this.calcDamage(attacker, defender, skill);
      const actualDmg = defender.takeDamage(dmg);
      result.events.push({ type: 'damage', amount: actualDmg, isCrit, elemMul });

      if (skill.statusChance && Math.random() < skill.statusChance) {
        defender.applyStatus(skill.statusEffect, 3);
        result.events.push({ type: 'status_applied', status: skill.statusEffect, target: 'defender' });
      }
      if (skill.selfStatus) {
        if (skill.selfStatus === 'dan_up') {
          const prevDan = attacker.dan;
          attacker.dan = Math.min(5, attacker.dan + 1);
          if (attacker.dan > prevDan) {
            result.events.push({ type: 'dan_up', newDan: attacker.dan });
          }
        } else {
          attacker.applyStatus(skill.selfStatus, 4);
          result.events.push({ type: 'status_applied', status: skill.selfStatus, target: 'attacker' });
        }
      }
    } else if (skill.type === 'heal') {
      const danBonus = danMultiplier(attacker.dan);
      const healAmt  = Math.floor((skill.healAmt ?? 60) * danBonus);
      const actual   = attacker.heal(healAmt);
      result.events.push({ type: 'heal', amount: actual });
      if (skill.selfStatus) {
        attacker.applyStatus(skill.selfStatus, 4);
        result.events.push({ type: 'status_applied', status: skill.selfStatus, target: 'attacker' });
      }
    } else if (skill.type === 'buff') {
      if (skill.selfStatus === 'shield') {
        attacker.shields = Math.floor(attacker.def * 1.5);
        result.events.push({ type: 'shield', amount: attacker.shields });
      } else if (skill.selfStatus) {
        attacker.applyStatus(skill.selfStatus, 4);
        result.events.push({ type: 'status_applied', status: skill.selfStatus, target: 'attacker' });
      }
    }

    return result;
  }

  enemyChooseAction() {
    const e = this.enemy;
    const p = this.player;

    // Decision weights
    const hpRatio = e.hp / e.maxHp;
    const usableSkills = e.skills.filter(s => e.pp >= s.ppCost);

    if (usableSkills.length === 0) {
      return { type: 'basic' };
    }

    // Prioritize heal if low HP
    if (hpRatio < 0.35) {
      const healSkill = usableSkills.find(s => s.type === 'heal');
      if (healSkill) return { type: 'skill', skill: healSkill };
    }

    // Use shield if not already shielded and has skill
    if (e.shields <= 0) {
      const shieldSkill = usableSkills.find(s => s.type === 'buff' && s.selfStatus === 'shield');
      if (shieldSkill && Math.random() < 0.3) return { type: 'skill', skill: shieldSkill };
    }

    // Favor high-power attack skills
    const atkSkills = usableSkills.filter(s => s.type === 'attack');
    if (atkSkills.length > 0 && Math.random() < 0.8) {
      const sorted = [...atkSkills].sort((a, b) => b.power - a.power);
      const top = sorted.slice(0, 2);
      return { type: 'skill', skill: top[Math.floor(Math.random() * top.length)] };
    }

    // Random pick
    return { type: 'skill', skill: usableSkills[Math.floor(Math.random() * usableSkills.length)] };
  }

  processRegen(char) {
    if (char.hasStatus('regen')) {
      const healAmt = Math.floor(char.maxHp * 0.05);
      char.heal(healAmt);
      return healAmt;
    }
    return 0;
  }

  processBurn(char) {
    if (char.hasStatus('burn')) {
      const burnDmg = Math.floor(char.maxHp * 0.06);
      char.takeDamage(burnDmg);
      return burnDmg;
    }
    return 0;
  }
}

// ===== GAME CONTROLLER =====
const Game = (() => {
  let player, enemy, battle;
  let isPlayerTurn = true;
  let busy = false;
  let battleOver = false; // [Fix2/10] Prevents commands re-enabling after battle ends
  let currentMenu = null;

  // ---- INIT ----
  function startBattle() {
    player = new Character({
      id: 'player', name: 'P1', level: 48,
      element: 'fire', isPlayer: true,
      maxHp: 450, hp: 312,
      maxPp: 50, pp: 40,
      baseCP: 700, dan: 3,
      atk: 85, def: 62, spd: 70, crit: 0.12,
      exp: 4100, expNext: 4500,
      skills: ['flame_fang', 'inferno_rush', 'flare_heal', 'shadow_bind', 'fox_fire', 'eto_surge'],
    });

    enemy = new Character({
      id: 'enemy', name: 'CP', level: 50,
      element: 'lightning', isPlayer: false,
      maxHp: 510, hp: 215,
      maxPp: 40, pp: 30,
      baseCP: 800, dan: 4,
      atk: 92, def: 70, spd: 65, crit: 0.1,
      exp: 0, expNext: 9999,
      skills: ['thunder_bolt', 'golden_shield', 'divine_smite', 'regen_aura', 'lightning_strike'],
    });

    battle = new BattleEngine(player, enemy);
    battleOver = false;

    showScreen('battle-screen');
    renderAll();
    updateTimeline();
    updateMovePanel();
    populateMoveList();
    startParticles();
    addLog('バトル開始！P1 vs CP！', 'system');
    addLog('P1のターン。コマンドを選んでください。', 'system');

    isPlayerTurn = true;
    busy = false;
    enableCommands(true);

    document.addEventListener('keydown', handleKey);
  }

  function restart() {
    stopParticles();
    document.removeEventListener('keydown', handleKey);
    showScreen('title-screen');
  }

  // ---- RENDER ----
  function renderAll() {
    renderPlayerHUD();
    renderEnemyHUD();
    renderStatusEffects();
  }

  function renderPlayerHUD() {
    const p = player;
    $('p-name').textContent   = p.name;
    $('p-lv').textContent     = p.level;
    $('p-hp-val').textContent = `${p.hp}/${p.maxHp}`;
    $('p-pp-val').textContent = `${p.pp}/${p.maxPp}`;
    $('p-cp-val').textContent = p.cp;
    $('p-dan').textContent    = p.dan;
    $('p-exp-bar').style.width = pct(p.exp, p.expNext);

    const hpPct = pct(p.hp, p.maxHp);
    const hpBar = $('p-hp-bar');
    hpBar.style.width = hpPct;
    hpBar.classList.toggle('low', p.hp / p.maxHp < 0.25);

    $('p-pp-bar').style.width = pct(p.pp, p.maxPp);

    $('ms-cp').textContent = p.cp;
    $('ms-lv').textContent = p.level;
    $('ms-exp').textContent = `${p.exp}/${p.expNext}`;
  }

  function renderEnemyHUD() {
    const e = enemy;
    $('e-name').textContent   = e.name;
    $('e-lv').textContent     = e.level;
    $('e-hp-val').textContent = `${e.hp}/${e.maxHp}`;
    $('e-pp-val').textContent = `${e.pp}/${e.maxPp}`;
    $('e-cp-val').textContent = e.cp;
    $('e-dan').textContent    = e.dan;

    const hpPct = pct(e.hp, e.maxHp);
    const hpBar = $('e-hp-bar');
    hpBar.style.width = hpPct;
    hpBar.classList.toggle('low', e.hp / e.maxHp < 0.25);

    $('e-pp-bar').style.width = pct(e.pp, e.maxPp);
  }

  function renderStatusEffects() {
    renderStatusPanel('p-status-effects', player);
    renderStatusPanel('e-status-effects', enemy);
  }

  function renderStatusPanel(id, char) {
    const el = document.getElementById(id);
    el.innerHTML = '';
    for (const [status, turns] of Object.entries(char.statusEffects)) {
      const badge = document.createElement('div');
      badge.className = `status-badge status-${status}`;
      badge.textContent = STATUS_LABELS[status] ?? status;
      if (turns > 0) badge.textContent += ` (${turns})`;
      el.appendChild(badge);
    }
    // Shield
    if (char.shields > 0) {
      const badge = document.createElement('div');
      badge.className = 'status-badge status-shield';
      badge.textContent = `シールド (${char.shields})`;
      el.appendChild(badge);
    }
  }

  const STATUS_LABELS = {
    burn: '🔥炎上', stun: '⚡スタン', bind: '🕷縛り',
    regen: '💛再生', shield: '🛡シールド', dan_up: '⬆段上昇',
  };

  function updateTimeline() {
    battle.buildTimeline();
    const track = document.getElementById('timeline-track');
    track.innerHTML = '';
    // [Fix8] Limit tokens to 4 on narrow screens to prevent overflow
    const maxTokens = window.innerWidth < 600 ? 4 : 6;
    battle.timeline.slice(0, maxTokens).forEach((entry, i) => {
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'tl-arrow';
        arrow.textContent = '▶';
        track.appendChild(arrow);
      }
      const tok = document.createElement('div');
      const isP = entry.who === 'player';
      tok.className = `tl-token ${isP ? 'player-token' : 'enemy-token'} ${i === 0 ? 'active' : ''}`;
      const img = document.createElement('img');
      img.src = isP ? 'assets/characters/player.svg' : 'assets/characters/enemy.svg';
      img.alt = isP ? 'P1' : 'CP';
      tok.appendChild(img);
      track.appendChild(tok);
    });
  }

  function updateMovePanel() {
    populateMoveList();
  }

  function populateMoveList() {
    const list = document.getElementById('move-list');
    list.innerHTML = '';
    player.skills.forEach(skill => {
      const canUse = player.pp >= skill.ppCost;
      const item = document.createElement('div');
      item.className = 'move-item';
      // [Fix3] Show per-skill PP cost, not total remaining PP
      item.innerHTML = `
        <span class="move-icon">${skill.icon}</span>
        <span class="move-name">${skill.name}</span>
        ${skill.power > 0 ? `<span class="move-pow">威力:${skill.power}</span>` : ''}
        <span class="move-pp">コスト:${skill.ppCost}</span>
      `;
      if (!canUse) item.style.opacity = '0.45';
      item.addEventListener('click', () => {
        if (isPlayerTurn && !busy && canUse) executePlayerSkill(skill);
      });
      list.appendChild(item);
    });
  }

  // ---- MENUS ----
  function openMenu(type) {
    if (!isPlayerTurn || busy) return;
    closeMenu();
    currentMenu = type;

    if (type === 'skill') {
      buildSkillList();
      document.getElementById('skill-submenu').classList.remove('hidden');
    } else if (type === 'item') {
      buildItemList();
      document.getElementById('item-submenu').classList.remove('hidden');
    } else if (type === 'change') {
      buildChangeList();
      document.getElementById('change-submenu').classList.remove('hidden');
    }
  }

  function closeMenu() {
    ['skill-submenu','item-submenu','change-submenu'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
    currentMenu = null;
  }

  function buildSkillList() {
    const list = document.getElementById('skill-list');
    list.innerHTML = '';
    player.skills.forEach(skill => {
      const canUse = player.pp >= skill.ppCost;
      const el = document.createElement('div');
      el.className = 'skill-entry';
      const elemData = ELEMENTS[skill.element];
      el.innerHTML = `
        <span class="entry-icon">${skill.icon}</span>
        <div class="entry-info">
          <div class="entry-name">${skill.name}</div>
          <div class="entry-desc">${skill.desc}</div>
        </div>
        <div class="entry-cost">
          <span class="pp-cost">PP: ${skill.ppCost}/${player.pp}</span>
          ${skill.power > 0 ? `<span class="pow-val">威力 ${skill.power}</span>` : ''}
          <span class="elem-tag element-badge ${skill.element}">${elemData.name}</span>
        </div>
      `;
      if (!canUse) el.style.opacity = '0.45';
      el.addEventListener('click', () => {
        if (canUse) { closeMenu(); executePlayerSkill(skill); }
      });
      // [Fix6] Support both hover (desktop) and tap (mobile) for tooltip
      el.addEventListener('mouseenter', () => showTooltip(skill));
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('touchstart', (e) => { e.preventDefault(); showTooltip(skill); }, { passive: false });
      el.addEventListener('touchend', () => setTimeout(hideTooltip, 1800));
      list.appendChild(el);
    });
  }

  function buildItemList() {
    const list = document.getElementById('item-list');
    list.innerHTML = '';
    player.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'item-entry';
      el.innerHTML = `
        <span class="entry-icon">${item.icon}</span>
        <div class="entry-info">
          <div class="entry-name">${item.name} ×${item.count}</div>
          <div class="entry-desc">${item.desc}</div>
        </div>
      `;
      if (item.count <= 0) el.style.opacity = '0.4';
      el.addEventListener('click', () => {
        if (item.count > 0) { closeMenu(); executePlayerItem(item); }
      });
      list.appendChild(el);
    });
  }

  function buildChangeList() {
    const list = document.getElementById('change-list');
    list.innerHTML = '';
    STANCES.forEach(stance => {
      const el = document.createElement('div');
      el.className = 'change-entry';
      el.innerHTML = `
        <span class="entry-icon">${stance.icon}</span>
        <div class="entry-info">
          <div class="entry-name">${stance.name}${player.stance === stance.id ? ' ✓' : ''}</div>
          <div class="entry-desc">${stance.desc}</div>
        </div>
      `;
      el.addEventListener('click', () => {
        closeMenu();
        executePlayerChange(stance.id);
      });
      list.appendChild(el);
    });
  }

  function showTooltip(skill) {
    const tt = document.getElementById('skill-tooltip');
    document.getElementById('tooltip-name').textContent = `${skill.icon} ${skill.name}`;
    document.getElementById('tooltip-desc').textContent = skill.desc;
    document.getElementById('tooltip-stats').innerHTML = `
      <span>威力: ${skill.power || '—'}</span>
      <span>PP: ${skill.ppCost}</span>
      <span>属性: ${ELEMENTS[skill.element]?.name}</span>
    `;
    tt.classList.remove('hidden');
  }

  function hideTooltip() {
    document.getElementById('skill-tooltip').classList.add('hidden');
  }

  // ---- ACTIONS ----
  async function executePlayerSkill(skill) {
    if (busy || !isPlayerTurn) return;
    busy = true;
    enableCommands(false);

    addLog(`P1は「${skill.name}」を使った！`, 'player-act');
    animateCharAttack('player');
    await wait(200);

    const result = battle.executeSkill(player, enemy, skill);
    await processResult(result, 'player');

    renderAll();
    updateTimeline();
    populateMoveList();

    if (!checkBattleEnd()) {
      await wait(400);
      await enemyTurn();
    }

    // [Fix2] Only re-enable controls if battle is still ongoing
    if (!battleOver) {
      busy = false;
      isPlayerTurn = true;
      enableCommands(true);
    }
  }

  async function executePlayerItem(item) {
    if (busy || !isPlayerTurn) return;
    busy = true;
    enableCommands(false);

    item.count--;
    addLog(`P1は「${item.name}」を使った！`, 'player-act');

    if (item.use.type === 'heal') {
      const actual = player.heal(item.use.amt);
      showDamageNumber(actual, 'heal', true);
      addLog(`HPが ${actual} 回復した！`, 'heal-act');
      fxHeal('player-char');
    } else if (item.use.type === 'pp') {
      const actual = player.recoverPP(item.use.amt);
      showDamageNumber(actual, 'pp', true);
      addLog(`PPが ${actual} 回復した！`, 'heal-act');
    } else if (item.use.type === 'cure') {
      player.clearStatuses();
      addLog('状態異常が回復した！', 'heal-act');
    } else if (item.use.type === 'dan') {
      player.dan = Math.min(5, player.dan + 1);
      addLog(`段数が ${player.dan} に上がった！`, 'system');
      showBattleMessage(`段数 UP！ 第${player.dan}段`);
    }

    renderAll();
    populateMoveList();
    await wait(600);

    if (!checkBattleEnd()) {
      await enemyTurn();
    }

    if (!battleOver) {
      busy = false;
      isPlayerTurn = true;
      enableCommands(true);
    }
  }

  async function executePlayerChange(stanceId) {
    if (busy || !isPlayerTurn) return;
    busy = true;
    enableCommands(false);

    const stance = STANCES.find(s => s.id === stanceId);
    player.setStance(stanceId);
    addLog(`P1は「${stance.name}」に変更した！`, 'player-act');
    showBattleMessage(`${stance.icon} ${stance.name}`);
    await wait(700);

    renderAll();
    updateTimeline();

    if (!checkBattleEnd()) {
      await enemyTurn();
    }

    // [Fix10] Guard against re-enabling after stance change ends battle
    if (!battleOver) {
      busy = false;
      isPlayerTurn = true;
      enableCommands(true);
    }
  }

  async function tryRun() {
    if (busy || !isPlayerTurn) return;
    busy = true;
    enableCommands(false);

    const runChance = 0.5 + (player.effectiveSpd() - enemy.effectiveSpd()) * 0.01;
    if (Math.random() < runChance) {
      addLog('P1は逃げ出した！', 'system');
      showBattleMessage('逃げた！');
      battleOver = true;
      stopParticles();
      await wait(1500);
      showResult(null);
    } else {
      addLog('しかし逃げ出せなかった！', 'system');
      showBattleMessage('逃げられなかった！');
      await wait(600);
      await enemyTurn();
      busy = false;
      isPlayerTurn = true;
      enableCommands(true);
    }
  }

  async function enemyTurn() {
    isPlayerTurn = false;

    // Tick status effects
    const pExpired = player.tickStatus();
    const eExpired = enemy.tickStatus();

    // Process burn damage
    const pBurn = battle.processBurn(player);
    if (pBurn > 0) { addLog(`P1は炎上で ${pBurn} ダメージを受けた！`, 'enemy-act'); showDamageNumber(pBurn, 'damage', true); }
    const eBurn = battle.processBurn(enemy);
    if (eBurn > 0) { addLog(`CPは炎上で ${eBurn} ダメージを受けた！`, 'player-act'); showDamageNumber(eBurn, 'damage', false); }

    // Process regen
    const pRegen = battle.processRegen(player);
    if (pRegen > 0) { addLog(`P1は再生で ${pRegen} HP回復した！`, 'heal-act'); }
    const eRegen = battle.processRegen(enemy);
    if (eRegen > 0) { addLog(`CPは再生で ${eRegen} HP回復した！`, 'heal-act'); }

    renderAll();
    if (checkBattleEnd()) return;

    await wait(400);

    if (enemy.hasStatus('stun')) {
      addLog('CPはスタンで行動できない！', 'enemy-act');
      await wait(600);
      return;
    }

    const action = battle.enemyChooseAction();
    if (action.type === 'skill') {
      addLog(`CPは「${action.skill.name}」を使った！`, 'enemy-act');
      animateCharAttack('enemy');
      await wait(300);
      const result = battle.executeSkill(enemy, player, action.skill);
      await processResult(result, 'enemy');
    } else {
      const dmg = Math.floor(enemy.atk * 0.6 * (0.9 + Math.random() * 0.2));
      const actual = player.takeDamage(dmg);
      addLog(`CPは攻撃した！P1に ${actual} ダメージ！`, 'enemy-act');
      animateCharAttack('enemy');
      await wait(200);
      animateCharHit('player-sprite');
      showDamageNumber(actual, 'damage', true);
      fxBurst('enemy', true);
    }

    renderAll();
    updateTimeline();
    populateMoveList();
    checkBattleEnd();
  }

  async function processResult(result, actorSide) {
    const onPlayer = actorSide === 'player';
    for (const ev of result.events) {
      if (ev.type === 'damage') {
        const isPlayerHit = onPlayer; // player attacked enemy
        const targetIsPlayer = !isPlayerHit;
        animateCharHit(isPlayerHit ? 'enemy-sprite' : 'player-sprite');
        fxBurst(onPlayer ? 'enemy' : 'player', !onPlayer);
        showDamageNumber(ev.amount, ev.isCrit ? 'critical' : 'damage', targetIsPlayer);
        const elemSymbol = ELEMENTS[result.skill.element]?.name ?? '';
        addLog(
          `${ev.isCrit ? '🌟クリット！' : ''}[${elemSymbol}] ${ev.amount} ダメージ！${ev.elemMul > 1.2 ? ' 効果抜群！' : ev.elemMul < 0.8 ? ' 効果いまひとつ…' : ''}`,
          onPlayer ? 'player-act' : 'enemy-act'
        );
        await wait(150);
      } else if (ev.type === 'heal') {
        fxHeal(onPlayer ? 'player-char' : 'enemy-char');
        showDamageNumber(ev.amount, 'heal', onPlayer);
        addLog(`${ev.amount} HP回復した！`, 'heal-act');
        await wait(100);
      } else if (ev.type === 'shield') {
        addLog(`シールド (${ev.amount}) を張った！`, onPlayer ? 'player-act' : 'enemy-act');
      } else if (ev.type === 'status_applied') {
        const label = STATUS_LABELS[ev.status] ?? ev.status;
        const isP1 = (actorSide === 'player') === (ev.target === 'attacker');
        addLog(`${isP1 ? 'P1' : 'CP'}は${label}状態になった！`, 'system');
      } else if (ev.type === 'dan_up') {
        addLog(`段数が ${ev.newDan} に上昇！`, 'system');
        showBattleMessage(`段数 UP！ 第${ev.newDan}段`);
        await wait(500);
      } else if (ev.type === 'stunned') {
        addLog('スタンで行動できない！', 'system');
        const stunSpriteId = onPlayer ? 'player-sprite' : 'enemy-sprite';
        const stunEl = document.getElementById(stunSpriteId);
        stunEl.classList.add('char-stunned');
        setTimeout(() => stunEl.classList.remove('char-stunned'), 560);
      } else if (ev.type === 'miss') {
        showDamageNumber(0, 'miss', !onPlayer);
        addLog('ミス！攻撃が当たらなかった！', 'system');
      } else if (ev.type === 'no_pp') {
        addLog('PPが足りない！', 'system');
      }
    }
  }

  // ---- BATTLE END ----
  function checkBattleEnd() {
    if (!enemy.isAlive) {
      battleOver = true; // [Fix2] Set before async to block any pending re-enable
      stopParticles();
      enableCommands(false);
      setTimeout(() => {
        const leveled = player.gainExp(300);
        addLog('CPを倒した！', 'system');
        showBattleMessage('勝利！！');
        setTimeout(() => showResult('victory', leveled), 1500);
      }, 500);
      return true;
    }
    if (!player.isAlive) {
      battleOver = true;
      stopParticles();
      const sprite = document.getElementById('player-sprite');
      sprite.classList.add('char-dead');
      document.getElementById('player-char').classList.add('char-dead-state');
      enableCommands(false);
      setTimeout(() => {
        addLog('P1は倒れた…', 'system');
        showBattleMessage('敗北…');
        setTimeout(() => showResult('defeat'), 1500);
      }, 500);
      return true;
    }
    return false;
  }

  function showResult(outcome, leveled = false) {
    const screen = document.getElementById('result-screen');
    const title  = document.getElementById('result-title');
    const expEl  = document.getElementById('result-exp');
    const stats  = document.getElementById('result-stats');

    if (outcome === 'victory') {
      screen.className = 'screen victory';
      title.textContent = '勝利！';
      expEl.textContent = `EXP +300${leveled ? ' 🎉 レベルアップ！' : ''}`;
      stats.textContent = `P1 Lv${player.level} | HP ${player.hp}/${player.maxHp} | CP ${player.cp}`;
    } else if (outcome === 'defeat') {
      screen.className = 'screen defeat';
      title.textContent = '敗北…';
      expEl.textContent = '次はもっと上手くやれる…';
      stats.textContent = '';
    } else {
      screen.className = 'screen run';
      title.textContent = '逃走';
      expEl.textContent = '戦いを避けた…';
      stats.textContent = '';
    }

    showScreen('result-screen');
  }

  // ---- PARTICLE SYSTEM ----
  let sparkInterval = null;

  function startParticles() {
    if (sparkInterval) return;
    sparkInterval = setInterval(spawnSpark, 280);
  }

  function stopParticles() {
    if (sparkInterval) { clearInterval(sparkInterval); sparkInterval = null; }
    const c = document.getElementById('spark-container');
    if (c) c.innerHTML = '';
  }

  function spawnSpark() {
    const container = document.getElementById('spark-container');
    if (!container) return;
    const isFireSpark = Math.random() < 0.55;
    const spark = document.createElement('div');
    spark.className = 'spark';
    const startX = 18 + Math.random() * 64;
    const startY = 20 + Math.random() * 40;
    const dx = (Math.random() - 0.5) * 130;
    const dy = -(35 + Math.random() * 90);
    const dur = (1.1 + Math.random() * 1.6).toFixed(2);
    const hue  = isFireSpark ? 15 + Math.random() * 20 : 45 + Math.random() * 12;
    const lum  = 55 + Math.random() * 22;
    const color = `hsl(${hue},100%,${lum}%)`;
    const size  = 3 + Math.random() * 3;
    spark.style.cssText = [
      `left:${startX}%`, `top:${startY}%`,
      `width:${size}px`, `height:${size}px`,
      `background:${color}`,
      `box-shadow:0 0 6px ${color}`,
      `--dx:${dx}`, `--dy:${dy}`,
      `--dur:${dur}s`,
    ].join(';');
    container.appendChild(spark);
    setTimeout(() => spark.remove(), parseFloat(dur) * 1000 + 100);
  }

  function flashPlayerAura() {
    const wrap = document.querySelector('.player-aura-wrap');
    if (!wrap) return;
    wrap.classList.add('aura-flash');
    setTimeout(() => wrap.classList.remove('aura-flash'), 420);
  }

  function flashEnemyAura() {
    const wrap = document.querySelector('.enemy-aura-wrap');
    if (!wrap) return;
    wrap.classList.add('aura-flash');
    setTimeout(() => wrap.classList.remove('aura-flash'), 420);
  }

  // ---- EFFECTS ----
  function animateCharAttack(who) {
    const el = document.getElementById(who === 'player' ? 'player-char' : 'enemy-char');
    el.classList.remove('char-attack-left', 'char-attack-right');
    void el.offsetWidth;
    el.classList.add(who === 'player' ? 'char-attack-left' : 'char-attack-right');
    if (who === 'player') flashPlayerAura(); else flashEnemyAura();
    setTimeout(() => el.classList.remove('char-attack-left', 'char-attack-right'), 500);
  }

  function animateCharHit(spriteId) {
    const el = document.getElementById(spriteId);
    el.classList.remove('char-hit');
    void el.offsetWidth;
    el.classList.add('char-hit');
    setTimeout(() => el.classList.remove('char-hit'), 400);
  }

  function fxBurst(side, targetIsPlayer) {
    const layer = document.getElementById('effects-layer');
    const div = document.createElement('div');
    div.className = targetIsPlayer ? 'fx-gold-burst' : 'fx-fire-burst';
    const x = targetIsPlayer ? '15%' : '72%';
    div.style.cssText = `left:${x};top:30%;width:80px;height:80px;margin-left:-40px;margin-top:-40px;`;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 600);
  }

  function fxHeal(charId) {
    const layer = document.getElementById('effects-layer');
    const div = document.createElement('div');
    div.className = 'fx-heal';
    div.textContent = '✨';
    const isPlayer = charId.includes('player');
    div.style.cssText = `left:${isPlayer ? '18%' : '72%'};top:35%;font-size:32px;`;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 1000);
  }

  function showDamageNumber(amount, type, targetIsPlayer) {
    const layer = document.getElementById('damage-numbers');
    const div = document.createElement('div');
    div.className = `dmg-num ${type}`;
    const baseX = targetIsPlayer ? 15 : 68;
    const x = baseX + (Math.random() * 8 - 4);
    const y = 25 + (Math.random() * 15);
    div.style.cssText = `left:${x}%;top:${y}%;`;
    div.textContent = type === 'miss' ? 'ミス！' : type === 'critical' ? `${amount}!!` : amount;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 1400);
  }

  function showBattleMessage(msg) {
    const el = document.getElementById('battle-message');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1600);
  }

  // ---- LOGGING ----
  function addLog(msg, cls = '') {
    const log = document.getElementById('battle-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${cls}`;
    entry.textContent = msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    // Keep last 30 entries
    while (log.children.length > 30) log.removeChild(log.firstChild);
  }

  // ---- UI HELPERS ----
  function enableCommands(enabled) {
    ['btn-skill','btn-item','btn-change','btn-run'].forEach(id => {
      document.getElementById(id).disabled = !enabled;
    });
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function $(id) { return document.getElementById(id); }
  function pct(val, max) { return `${Math.round((val / max) * 100)}%`; }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ---- KEYBOARD ----
  function handleKey(e) {
    if (busy) return;
    if (!isPlayerTurn) return;
    switch (e.key.toLowerCase()) {
      case 'a': openMenu('skill'); break;
      case 's': openMenu('item'); break;
      case 'd': openMenu('change'); break;
      case 'f': tryRun(); break;
      case 'escape': closeMenu(); break;
    }
  }

  // [Fix9] Mobile log overlay toggle
  function toggleLog() {
    const panel = document.getElementById('battle-log-panel');
    panel.classList.toggle('log-visible');
  }

  return { startBattle, restart, openMenu, closeMenu, tryRun, toggleLog };
})();
