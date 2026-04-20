// === core/plugin-interfaces/index.ts ===

export interface ISkillModule {
  registerSkills(): void;
}

export interface IEquipmentModule {
  registerEquipment(): void;
}

export interface IGachaModule {
  openGachaBanner(): void;
}

export interface IQuestModule {
  loadQuests(): void;
}

export interface IAdModule {
  showRewardedAd(onComplete: () => void): void;
}

export interface IIAPModule {
  purchaseProduct(productId: string, onResult: (success: boolean) => void): void;
}
