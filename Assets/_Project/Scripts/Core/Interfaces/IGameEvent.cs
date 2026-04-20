namespace VampireSurvivors.Core
{
    /// <summary>
    /// 遊戲事件標記介面 — 所有遊戲事件結構體皆須實作此介面，
    /// 搭配事件匯流排（EventBus）實現模組間鬆耦合通訊。
    /// </summary>
    public interface IGameEvent { }
}
