// === core/interfaces/IPassiveItem.ts ===
import { PassiveItemConfig, StatModifier } from '../../data/types';

export interface IPassiveItem {
  readonly id: string;
  readonly config: PassiveItemConfig;
  level: number;
  readonly maxLevel: number;

  getModifier(): StatModifier;
  levelUp(): void;
}
