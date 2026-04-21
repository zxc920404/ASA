import { WeaponConfig, PassiveItemConfig } from '../../data/types';
import { eventBus } from '../../core/events/EventBus';
import { GameEventNames, XPCollectedEvent, PlayerLevelUpEvent } from '../../core/events/GameEvents';
import { WeaponSystem, MAX_WEAPONS, MAX_PASSIVES } from '../weapons/WeaponSystem';
import { PassiveItemBase } from './PassiveItemBase';

export interface LevelUpOption {
  type: 'new_weapon' | 'upgrade_weapon' | 'new_passive' | 'upgrade_passive';
  id: string;
  displayName: string;
  description: string;
  config?: WeaponConfig | PassiveItemConfig;
}

export class LevelUpSystem {
  private weaponSystem: WeaponSystem;
  private allWeaponConfigs: WeaponConfig[];
  private allPassiveConfigs: PassiveItemConfig[];

  currentXP: number = 0;
  currentLevel: number = 1;
  xpToNextLevel: number = 10;

  private onLevelUp: (options: LevelUpOption[]) => void;

  constructor(
    weaponSystem: WeaponSystem,
    allWeaponConfigs: WeaponConfig[],
    allPassiveConfigs: PassiveItemConfig[],
    onLevelUp: (options: LevelUpOption[]) => void,
  ) {
    this.weaponSystem = weaponSystem;
    this.allWeaponConfigs = allWeaponConfigs;
    this.allPassiveConfigs = allPassiveConfigs;
    this.onLevelUp = onLevelUp;

    eventBus.on<XPCollectedEvent>(GameEventNames.XP_COLLECTED, (e) => {
      this.addXP(e.amount);
    });
  }

  addXP(amount: number): void {
    this.currentXP += amount;
    // Only trigger one level-up at a time; remaining XP will trigger next level
    // after the player picks an option and the game resumes
    if (this.currentXP >= this.xpToNextLevel) {
      this.currentXP -= this.xpToNextLevel;
      this.currentLevel++;
      this.xpToNextLevel = this.calculateXPThreshold(this.currentLevel);

      const evt: PlayerLevelUpEvent = { newLevel: this.currentLevel };
      eventBus.emit(GameEventNames.PLAYER_LEVEL_UP, evt);

      const options = this.generateOptions(3);
      if (options.length > 0) {
        this.onLevelUp(options);
      }
      // If no options available, just skip the level-up UI
    }
  }

  /** Called after player picks an option — check if there's another pending level-up */
  checkPendingLevelUp(): void {
    if (this.currentXP >= this.xpToNextLevel) {
      this.currentXP -= this.xpToNextLevel;
      this.currentLevel++;
      this.xpToNextLevel = this.calculateXPThreshold(this.currentLevel);

      const evt: PlayerLevelUpEvent = { newLevel: this.currentLevel };
      eventBus.emit(GameEventNames.PLAYER_LEVEL_UP, evt);

      const options = this.generateOptions(3);
      if (options.length > 0) {
        this.onLevelUp(options);
        return;
      }
    }
    // No more pending level-ups — signal to resume game
    this.onLevelUp([]);
  }

  generateOptions(count: number): LevelUpOption[] {
    const weapons = this.weaponSystem.getWeapons();
    const passives = this.weaponSystem.getPassives();
    const weaponsFull = weapons.length >= MAX_WEAPONS;
    const passivesFull = passives.length >= MAX_PASSIVES;

    // 收集所有可能的選項
    const newItemPool: LevelUpOption[] = [];   // 新裝備/能力
    const upgradePool: LevelUpOption[] = [];   // 升級現有裝備/能力

    // 可升級的武器
    for (const w of weapons) {
      if (w.level < w.maxLevel) {
        const nextLd = w.config.levelData[w.level];
        upgradePool.push({
          type: 'upgrade_weapon',
          id: w.id,
          displayName: `⚔ ${w.config.displayName} Lv${w.level + 1}`,
          description: nextLd?.description ?? '升級',
        });
      }
    }

    // 可升級的被動道具
    for (const p of passives) {
      if (p.level < p.maxLevel) {
        const nextLd = p.config.levelData[p.level];
        upgradePool.push({
          type: 'upgrade_passive',
          id: p.id,
          displayName: `💎 ${p.config.displayName} Lv${p.level + 1}`,
          description: nextLd?.description ?? '升級',
        });
      }
    }

    // 新武器（欄位未滿時）
    if (!weaponsFull) {
      const ownedIds = new Set(weapons.map(w => w.id));
      for (const cfg of this.allWeaponConfigs) {
        if (!ownedIds.has(cfg.weaponId)) {
          newItemPool.push({
            type: 'new_weapon',
            id: cfg.weaponId,
            displayName: `⚔ ${cfg.displayName}（新）`,
            description: cfg.levelData[0]?.description ?? '新武器',
            config: cfg,
          });
        }
      }
    }

    // 新被動道具（欄位未滿時）
    if (!passivesFull) {
      const ownedIds = new Set(passives.map(p => p.id));
      for (const cfg of this.allPassiveConfigs) {
        if (!ownedIds.has(cfg.itemId)) {
          newItemPool.push({
            type: 'new_passive',
            id: cfg.itemId,
            displayName: `💎 ${cfg.displayName}（新）`,
            description: cfg.levelData[0]?.description ?? '新道具',
            config: cfg,
          });
        }
      }
    }

    // 核心邏輯：欄位未滿時，至少保證 1 個新裝備/能力選項
    const result: LevelUpOption[] = [];

    if (newItemPool.length > 0 && (!weaponsFull || !passivesFull)) {
      // 欄位未滿：保證至少 1 個新裝備/能力
      this.shuffle(newItemPool);
      result.push(newItemPool[0]);

      // 剩餘位置從升級池和新裝備池混合填充
      const remaining = [...upgradePool, ...newItemPool.slice(1)];
      this.shuffle(remaining);
      for (const opt of remaining) {
        if (result.length >= count) break;
        if (!result.some(r => r.id === opt.id && r.type === opt.type)) {
          result.push(opt);
        }
      }
    } else {
      // 欄位已滿：只提供升級選項
      this.shuffle(upgradePool);
      for (const opt of upgradePool) {
        if (result.length >= count) break;
        result.push(opt);
      }
    }

    return result.slice(0, Math.min(count, result.length));
  }

  applyOption(option: LevelUpOption): void {
    switch (option.type) {
      case 'upgrade_weapon': {
        const w = this.weaponSystem.getWeaponById(option.id);
        if (w && w.level < w.maxLevel) w.levelUp();
        break;
      }
      case 'upgrade_passive': {
        const p = this.weaponSystem.getPassiveById(option.id);
        if (p && p.level < p.maxLevel) p.levelUp();
        break;
      }
      case 'new_weapon': {
        if (option.config) {
          this.weaponSystem.addWeapon(option.config as WeaponConfig);
        }
        break;
      }
      case 'new_passive': {
        if (option.config) {
          const passive = new PassiveItemBase(option.config as PassiveItemConfig);
          this.weaponSystem.addPassive(passive);
        }
        break;
      }
    }
  }

  private calculateXPThreshold(level: number): number {
    // Exponential growth: base 10, +5 per level, *1.1 scaling
    return Math.floor(10 + (level - 1) * 5 * Math.pow(1.1, level - 1));
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
