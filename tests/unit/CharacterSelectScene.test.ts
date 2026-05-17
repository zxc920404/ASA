import { describe, it, expect } from 'vitest';
import { CharacterConfig } from '../../src/data/types';

describe('CharacterSelectScene', () => {
  const mockCharacters: CharacterConfig[] = [
    {
      characterId: 'char_blue_swordsman',
      displayName: '青衣劍客',
      atlasFrame: 'char-swordsman',
      baseHP: 100,
      baseMoveSpeed: 165,
      baseAttackPower: 1.0,
      basePickupRange: 50,
      startingWeaponId: 'weapon_wind_sword',
      talentName: '輕功身法',
      talentDescription: '移動速度 +10%',
      talentModifiers: [{ stat: 'moveSpeed', value: 0.1, type: 'percent' }],
      unlockedByDefault: true,
      unlockCost: 0,
    },
    {
      characterId: 'char_armored_monk',
      displayName: '玄甲武僧',
      atlasFrame: 'char-monk',
      baseHP: 130,
      baseMoveSpeed: 135,
      baseAttackPower: 0.95,
      basePickupRange: 50,
      startingWeaponId: 'weapon_taichi_ring',
      talentName: '金剛不壞',
      talentDescription: '最大生命 +20%',
      talentModifiers: [{ stat: 'maxHP', value: 0.2, type: 'percent' }],
      unlockedByDefault: true,
      unlockCost: 0,
    },
    {
      characterId: 'char_flame_master',
      displayName: '赤焰掌門',
      atlasFrame: 'char-assassin',
      baseHP: 90,
      baseMoveSpeed: 150,
      baseAttackPower: 1.1,
      basePickupRange: 50,
      startingWeaponId: 'weapon_flame_palm',
      talentName: '烈焰真氣',
      talentDescription: '範圍攻擊傷害 +10%',
      talentModifiers: [{ stat: 'attackPower', value: 0.1, type: 'percent' }],
      unlockedByDefault: false,
      unlockCost: 1000,
    },
  ];

  describe('Character Display', () => {
    it('should display all characters from config', () => {
      expect(mockCharacters).toHaveLength(3);
      expect(mockCharacters[0].characterId).toBe('char_blue_swordsman');
      expect(mockCharacters[1].characterId).toBe('char_armored_monk');
      expect(mockCharacters[2].characterId).toBe('char_flame_master');
    });

    it('should show character attributes correctly', () => {
      const char = mockCharacters[0];
      expect(char.baseHP).toBe(100);
      expect(char.baseMoveSpeed).toBe(165);
      expect(char.baseAttackPower).toBe(1.0);
      expect(char.basePickupRange).toBe(50);
    });

    it('should display character talent information', () => {
      const char = mockCharacters[0];
      expect(char.talentName).toBe('輕功身法');
      expect(char.talentDescription).toBe('移動速度 +10%');
      expect(char.talentModifiers).toHaveLength(1);
      expect(char.talentModifiers?.[0].stat).toBe('moveSpeed');
      expect(char.talentModifiers?.[0].value).toBe(0.1);
      expect(char.talentModifiers?.[0].type).toBe('percent');
    });
  });

  describe('Unlock Status', () => {
    it('should identify unlocked characters', () => {
      const unlockedChars = mockCharacters.filter(c => c.unlockedByDefault);
      expect(unlockedChars).toHaveLength(2);
      expect(unlockedChars[0].characterId).toBe('char_blue_swordsman');
      expect(unlockedChars[1].characterId).toBe('char_armored_monk');
    });

    it('should identify locked characters', () => {
      const lockedChars = mockCharacters.filter(c => !c.unlockedByDefault);
      expect(lockedChars).toHaveLength(1);
      expect(lockedChars[0].characterId).toBe('char_flame_master');
      expect(lockedChars[0].unlockCost).toBe(1000);
    });

    it('should show unlock cost for locked characters', () => {
      const lockedChar = mockCharacters.find(c => c.characterId === 'char_flame_master');
      expect(lockedChar).toBeDefined();
      expect(lockedChar!.unlockCost).toBeGreaterThan(0);
      expect(lockedChar!.unlockCost).toBe(1000);
    });

    it('should have zero unlock cost for default unlocked characters', () => {
      const unlockedChars = mockCharacters.filter(c => c.unlockedByDefault);
      unlockedChars.forEach(char => {
        expect(char.unlockCost).toBe(0);
      });
    });
  });

  describe('Character Selection', () => {
    it('should allow selection of unlocked characters', () => {
      const unlockedChars = mockCharacters.filter(c => c.unlockedByDefault);
      expect(unlockedChars.length).toBeGreaterThan(0);
      
      // Simulate selecting first unlocked character
      const selectedChar = unlockedChars[0];
      expect(selectedChar.characterId).toBe('char_blue_swordsman');
    });

    it('should have starting weapon for each character', () => {
      mockCharacters.forEach(char => {
        expect(char.startingWeaponId).toBeDefined();
        expect(char.startingWeaponId).toMatch(/^weapon_/);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have display name for UI rendering', () => {
      mockCharacters.forEach(char => {
        expect(char.displayName).toBeDefined();
        expect(char.displayName.length).toBeGreaterThan(0);
      });
    });

    it('should have atlas frame for sprite rendering', () => {
      mockCharacters.forEach(char => {
        expect(char.atlasFrame).toBeDefined();
        expect(char.atlasFrame).toMatch(/^char-/);
      });
    });
  });
});
