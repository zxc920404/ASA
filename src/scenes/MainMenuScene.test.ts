import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from '../infrastructure/save/SaveSystem';
import { PermanentUpgradeSystem, PERMANENT_UPGRADES } from '../gameplay/level-up/PermanentUpgradeSystem';
import { ISaveProvider } from '../core/interfaces/ISaveProvider';

describe('MainMenuScene - Permanent Upgrade Interface', () => {
  let mockProvider: ISaveProvider;
  let saveSystem: SaveSystem;
  let upgradeSystem: PermanentUpgradeSystem;

  beforeEach(() => {
    // Create mock save provider
    const storage = new Map<string, string>();
    mockProvider = {
      save: (key: string, data: string) => storage.set(key, data),
      load: (key: string) => storage.get(key) ?? null,
      delete: (key: string) => storage.delete(key),
      exists: (key: string) => storage.has(key),
    };

    saveSystem = new SaveSystem(mockProvider);
    upgradeSystem = new PermanentUpgradeSystem(saveSystem);
  });

  describe('5 Upgrade Types', () => {
    it('should have exactly 5 permanent upgrade types', () => {
      expect(PERMANENT_UPGRADES).toHaveLength(5);
    });

    it('should include Max HP upgrade', () => {
      const maxHpUpgrade = PERMANENT_UPGRADES.find(u => u.stat === 'maxHP');
      expect(maxHpUpgrade).toBeDefined();
      expect(maxHpUpgrade?.displayName).toBe('生命強化');
    });

    it('should include Attack Power upgrade', () => {
      const attackUpgrade = PERMANENT_UPGRADES.find(u => u.stat === 'attackPower');
      expect(attackUpgrade).toBeDefined();
      expect(attackUpgrade?.displayName).toBe('攻擊強化');
    });

    it('should include Move Speed upgrade', () => {
      const speedUpgrade = PERMANENT_UPGRADES.find(u => u.stat === 'moveSpeed');
      expect(speedUpgrade).toBeDefined();
      expect(speedUpgrade?.displayName).toBe('速度強化');
    });

    it('should include XP Gain upgrade', () => {
      const xpUpgrade = PERMANENT_UPGRADES.find(u => u.stat === 'xpGain');
      expect(xpUpgrade).toBeDefined();
      expect(xpUpgrade?.displayName).toBe('經驗強化');
    });

    it('should include Pickup Range upgrade', () => {
      const pickupUpgrade = PERMANENT_UPGRADES.find(u => u.stat === 'pickupRange');
      expect(pickupUpgrade).toBeDefined();
      expect(pickupUpgrade?.displayName).toBe('拾取強化');
    });
  });

  describe('Current Level and Cost Display', () => {
    it('should show current level for each upgrade', () => {
      const levels = upgradeSystem.getUpgradeLevels();
      expect(levels).toHaveLength(5);
      expect(levels.every(l => typeof l === 'number')).toBe(true);
    });

    it('should show cost for next level', () => {
      const cost = upgradeSystem.getNextCost(0);
      expect(cost).toBe(100); // First level of Max HP costs 100
    });

    it('should return null cost when upgrade is maxed', () => {
      // Max out the first upgrade
      const data = saveSystem.load();
      data.permanentUpgradeLevels[0] = 10;
      saveSystem.save(data);

      const cost = upgradeSystem.getNextCost(0);
      expect(cost).toBeNull();
    });
  });

  describe('Coin Deduction', () => {
    it('should deduct coins when purchasing upgrade', () => {
      // Give player some gold
      const data = saveSystem.load();
      data.gold = 1000;
      saveSystem.save(data);

      const initialGold = upgradeSystem.getGold();
      const cost = upgradeSystem.getNextCost(0)!;

      upgradeSystem.purchase(0);

      const finalGold = upgradeSystem.getGold();
      expect(finalGold).toBe(initialGold - cost);
    });

    it('should not allow purchase without enough gold', () => {
      // Set gold to 0
      const data = saveSystem.load();
      data.gold = 0;
      saveSystem.save(data);

      const canPurchase = upgradeSystem.canPurchase(0);
      expect(canPurchase).toBe(false);

      const result = upgradeSystem.purchase(0);
      expect(result).toBe(false);
    });

    it('should allow purchase with enough gold', () => {
      // Give enough gold
      const data = saveSystem.load();
      data.gold = 1000;
      saveSystem.save(data);

      const canPurchase = upgradeSystem.canPurchase(0);
      expect(canPurchase).toBe(true);

      const result = upgradeSystem.purchase(0);
      expect(result).toBe(true);
    });
  });

  describe('Save Progress', () => {
    it('should save upgrade level to localStorage', () => {
      // Give gold and purchase
      const data = saveSystem.load();
      data.gold = 1000;
      saveSystem.save(data);

      upgradeSystem.purchase(0);

      // Reload and check
      const newData = saveSystem.load();
      expect(newData.permanentUpgradeLevels[0]).toBe(1);
    });

    it('should persist multiple upgrades', () => {
      // Give gold
      const data = saveSystem.load();
      data.gold = 10000;
      saveSystem.save(data);

      // Purchase multiple upgrades
      upgradeSystem.purchase(0);
      upgradeSystem.purchase(1);
      upgradeSystem.purchase(2);

      // Reload and check
      const newData = saveSystem.load();
      expect(newData.permanentUpgradeLevels[0]).toBe(1);
      expect(newData.permanentUpgradeLevels[1]).toBe(1);
      expect(newData.permanentUpgradeLevels[2]).toBe(1);
    });

    it('should maintain upgrade levels across save/load cycles', () => {
      // Give gold and purchase
      const data = saveSystem.load();
      data.gold = 10000;
      saveSystem.save(data);

      upgradeSystem.purchase(0);
      upgradeSystem.purchase(0);
      upgradeSystem.purchase(0);

      // Create new system instance (simulating app restart)
      const newUpgradeSystem = new PermanentUpgradeSystem(saveSystem);
      const level = newUpgradeSystem.getUpgradeLevel(0);
      expect(level).toBe(3);
    });
  });

  describe('Responsive Design', () => {
    it('should have all upgrade definitions with proper structure', () => {
      PERMANENT_UPGRADES.forEach(upgrade => {
        expect(upgrade.upgradeId).toBeDefined();
        expect(upgrade.displayName).toBeDefined();
        expect(upgrade.description).toBeDefined();
        expect(upgrade.stat).toBeDefined();
        expect(upgrade.valuePerLevel).toBeGreaterThan(0);
        expect(upgrade.maxLevel).toBe(10);
        expect(upgrade.costPerLevel).toHaveLength(10);
      });
    });

    it('should calculate stat bonuses correctly', () => {
      // Give gold and purchase some upgrades
      const data = saveSystem.load();
      data.gold = 10000;
      data.permanentUpgradeLevels = [3, 2, 1, 0, 0]; // Various levels
      saveSystem.save(data);

      const bonuses = upgradeSystem.getStatBonuses();

      // Max HP: 3 levels * 10 = 30 flat
      const maxHpBonus = bonuses.get('maxHP');
      expect(maxHpBonus?.flat).toBe(30);

      // Attack Power: 2 levels * 0.05 = 0.10 percent
      const attackBonus = bonuses.get('attackPower');
      expect(attackBonus?.percent).toBe(0.10);

      // Move Speed: 1 level * 0.05 = 0.05 percent
      const speedBonus = bonuses.get('moveSpeed');
      expect(speedBonus?.percent).toBe(0.05);
    });
  });
});
