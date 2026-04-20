using System;
using System.Collections.Generic;

namespace VampireSurvivors.Core
{
    /// <summary>
    /// 事件匯流排 — 模組間鬆耦合事件通訊中樞。
    /// 各模組透過訂閱與發布事件進行通訊，無需直接引用彼此。
    /// </summary>
    public static class EventBus
    {
        private static readonly Dictionary<Type, List<Delegate>> _handlers = new();

        /// <summary>
        /// 訂閱指定類型的遊戲事件。
        /// </summary>
        /// <typeparam name="T">事件結構體類型，須實作 <see cref="IGameEvent"/>。</typeparam>
        /// <param name="handler">事件處理委派。</param>
        public static void Subscribe<T>(Action<T> handler) where T : struct, IGameEvent
        {
            var type = typeof(T);
            if (!_handlers.ContainsKey(type))
                _handlers[type] = new List<Delegate>();
            _handlers[type].Add(handler);
        }

        /// <summary>
        /// 取消訂閱指定類型的遊戲事件。
        /// </summary>
        /// <typeparam name="T">事件結構體類型，須實作 <see cref="IGameEvent"/>。</typeparam>
        /// <param name="handler">先前訂閱的事件處理委派。</param>
        public static void Unsubscribe<T>(Action<T> handler) where T : struct, IGameEvent
        {
            var type = typeof(T);
            if (_handlers.ContainsKey(type))
                _handlers[type].Remove(handler);
        }

        /// <summary>
        /// 發布指定類型的遊戲事件，通知所有已訂閱的處理器。
        /// </summary>
        /// <typeparam name="T">事件結構體類型，須實作 <see cref="IGameEvent"/>。</typeparam>
        /// <param name="gameEvent">要發布的事件實例。</param>
        public static void Publish<T>(T gameEvent) where T : struct, IGameEvent
        {
            var type = typeof(T);
            if (_handlers.TryGetValue(type, out var handlers))
                foreach (var handler in handlers)
                    ((Action<T>)handler)?.Invoke(gameEvent);
        }

        /// <summary>
        /// 清除所有事件訂閱，通常在場景切換時呼叫。
        /// </summary>
        public static void Clear() => _handlers.Clear();
    }
}
