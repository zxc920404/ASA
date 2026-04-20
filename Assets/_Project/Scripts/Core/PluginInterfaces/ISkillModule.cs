namespace VampireSurvivors.Core
{
    /// <summary>
    /// 技能模組介面 — 供後續技能系統以插件形式擴展，
    /// 實作此介面即可將自訂技能註冊至遊戲系統。
    /// </summary>
    public interface ISkillModule
    {
        /// <summary>將模組內定義的技能註冊至遊戲系統。</summary>
        void RegisterSkills();
    }
}
