import { StatType } from '../../data/types';
import { SaveSystem } from '../../infrastructure/save/SaveSystem';

export interface PermanentUpgradeDefinition {
  upgradeId: string;
  displayName: string;
  description: string;
  stat: StatType;
  valuePerLevel: number;
  type: 'flat' | 'percent';
  maxLevel: number;
  costPerLevel: number[];
}

// 5 permanent upgrades
export const PERMANENT_UPGRADES: PermanentUpgradeDefinition[] = [
  {
    upgradeId: 'perm_maxhp',
    displayName: '生命強化',
    description: '每級 +10 最大生命值',
    stat: 'maxHP',
    valuePerLevel: 10,
    type: 'flat',
    maxLevel: 10,
    costPerLevel: [100, 200, 400, 600, 900, 1200, 1600, 2000, 2500, 3000],
  },
  {
    upgradeId: 'perm_attack',
    displayName: '攻擊強化',
    description: '每級 +5% 攻擊力',
    stat: 'attackPower',
    valuePerLevel: 0.05,
    type: 'percent',
    maxLevel: 10,
    costPerLevel: [150, 300, 500, 750, 1000, 1400, 1800, 2300, 2800, 3500],
  },
  {
    upgradeId: 'perm_speed',
    displayName: '速度強化',
    description: '每級 +5% 移動速度',
    stat: 'moveSpeed',
    valuePerLevel: 0.05,
    type: 'percent',
    maxLevel: 10,
    costPerLevel: [100, 200, 350, 500, 700, 950, 1200, 1500, 1900, 2400],
  },
  {
    upgradeId: 'perm_xp',
    displayName: '經驗強化',
    description: '每級 +10% 經驗值獲取',
    stat: 'xpGain',
    valuePerLevel: 0.10,
    type: 'percent',
    maxLevel: 10,
    costPerLevel: [120, 250, 400, 600, 850, 1100, 1400, 1800, 2200, 2800],
  },
  {
    upgradeId: 'perm_pickup',
    displayName: '拾取強化',
    description: '每級 +15 拾取範圍',
    stat: 'pickupRange',
    valuePerLevel: 15,
    type: 'flat',
    maxLevel: 10,
    costPerLevel: [80, 160, 300, 450, 650, 900, 1150, 1450, 1800, 2200],
  },
];

export class PermanentUpgradeSystem {
  private saveSystem: SaveSystem;

  constructor(saveSystem: SaveSystem) {
    this.saveSystem = saveSystem;
  }

  getUpgrades(): PermanentUpgradeDefinition[] {
    return PERMANENT_UPGRADES;
  }

  getUpgradeLevels(): number[] {
    const data = this.saveSystem.load();
    return [...data.permanentUpgradeLevels];
  }

  getUpgradeLevel(index: number): number {
    const levels = this.getUpgradeLevels();
    return levels[index] ?? 0;
  }

  getNextCost(index: number): number | null {
    const level = this.getUpgradeLevel(index);
    const upgrade = PERMANENT_UPGRADES[index];
    if (!upgrade || level >= upgrade.maxLevel) return null;
    return upgrade.costPerLevel[level];
  }

  canPurchase(index: number): boolean {
    const cost = this.getNextCost(index);
    if (cost === null) return false;
    const gold = this.saveSystem.getGold();
    return gold >= cost;
  }

  purchase(index: number): boolean {
    if (!this.canPurchase(index)) return false;

    const cost = this.getNextCost(index)!;
    const data = this.saveSystem.load();
    data.gold -= cost;
    data.permanentUpgradeLevels[index]++;
    this.saveSystem.save(data);
    return true;
  }

  /**
   * Get all stat bonuses from permanent upgrades to apply at game start.
   * Returns a map of stat -> { flat, percent } bonuses.
   */
  getStatBonuses(): Map<StatType, { flat: number; percent: number }> {
    const levels = this.getUpgradeLevels();
    const bonuses = new Map<StatType, { flat: number; percent: number }>();

    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const level = levels[i] ?? 0;
      if (level <= 0) return;

      const totalValue = upgrade.valuePerLevel * level;
      const existing = bonuses.get(upgrade.stat) ?? { flat: 0, percent: 0 };

      if (upgrade.type === 'flat') {
        existing.flat += totalValue;
      } else {
        existing.percent += totalValue;
      }

      bonuses.set(upgrade.stat, existing);
    });

    return bonuses;
  }

  getGold(): number {
    return this.saveSystem.getGold();
  }
}
