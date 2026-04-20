import { PassiveItemConfig, StatModifier } from '../../data/types';
import { IPassiveItem } from '../../core/interfaces/IPassiveItem';

export class PassiveItemBase implements IPassiveItem {
  readonly id: string;
  readonly config: PassiveItemConfig;
  readonly maxLevel: number;
  level: number = 1;

  constructor(config: PassiveItemConfig) {
    this.id = config.itemId;
    this.config = config;
    this.maxLevel = config.maxLevel;
  }

  getModifier(): StatModifier {
    const ld = this.config.levelData[this.level - 1];
    // Return the first modifier (primary stat)
    return ld.statModifiers[0];
  }

  getAllModifiers(): StatModifier[] {
    const ld = this.config.levelData[this.level - 1];
    return ld.statModifiers;
  }

  levelUp(): void {
    if (this.level < this.maxLevel) {
      this.level++;
    }
  }
}
