using System.Collections.Generic;
using UnityEngine;
using VampireSurvivors.Core;

namespace VampireSurvivors.Gameplay
{
    /// <summary>
    /// 武器系統 — 管理玩家角色的武器列表與自動攻擊邏輯。
    /// 負責攻擊間隔計時、目標選擇（最近敵人）、無敵人時暫停計時器。
    /// 最多同時裝備 6 把主動武器與 6 件被動道具。
    /// </summary>
    public class WeaponSystem : MonoBehaviour
    {
        /// <summary>主動武器上限。</summary>
        public const int MaxWeapons = 6;

        /// <summary>被動道具上限。</summary>
        public const int MaxPassives = 6;

        /// <summary>物件池管理器。</summary>
        [SerializeField] private ObjectPoolManager poolManager;

        /// <summary>敵人偵測半徑。</summary>
        [SerializeField] private float detectionRadius = 15f;

        /// <summary>敵人所在的物理層。</summary>
        [SerializeField] private LayerMask enemyLayer;

        /// <summary>主動武器列表。</summary>
        private readonly List<IWeapon> weapons = new();

        /// <summary>被動道具列表。</summary>
        private readonly List<IPassiveItem> passives = new();

        /// <summary>各武器的攻擊計時器。</summary>
        private readonly List<float> attackTimers = new();

        /// <summary>主動武器數量。</summary>
        public int WeaponCount => weapons.Count;

        /// <summary>被動道具數量。</summary>
        public int PassiveCount => passives.Count;

        /// <summary>主動武器唯讀列表。</summary>
        public IReadOnlyList<IWeapon> Weapons => weapons;

        /// <summary>被動道具唯讀列表。</summary>
        public IReadOnlyList<IPassiveItem> Passives => passives;

        /// <summary>物件池管理器參考（供外部存取）。</summary>
        public ObjectPoolManager PoolManager => poolManager;

        /// <summary>敵人物理層遮罩（供外部存取）。</summary>
        public LayerMask EnemyLayer => enemyLayer;

        /// <summary>
        /// 新增主動武器。若已達上限則不新增。
        /// </summary>
        /// <param name="weapon">要新增的武器。</param>
        /// <returns>是否成功新增。</returns>
        public bool AddWeapon(IWeapon weapon)
        {
            if (weapons.Count >= MaxWeapons) return false;
            weapons.Add(weapon);
            attackTimers.Add(0f);
            return true;
        }

        /// <summary>
        /// 移除主動武器。
        /// </summary>
        /// <param name="weapon">要移除的武器。</param>
        /// <returns>是否成功移除。</returns>
        public bool RemoveWeapon(IWeapon weapon)
        {
            int index = weapons.IndexOf(weapon);
            if (index < 0) return false;
            weapons.RemoveAt(index);
            attackTimers.RemoveAt(index);
            return true;
        }

        /// <summary>
        /// 替換指定索引的武器（用於武器進化）。
        /// </summary>
        /// <param name="index">武器索引。</param>
        /// <param name="newWeapon">新武器。</param>
        public void ReplaceWeapon(int index, IWeapon newWeapon)
        {
            if (index < 0 || index >= weapons.Count) return;
            weapons[index] = newWeapon;
            attackTimers[index] = 0f;
        }

        /// <summary>
        /// 新增被動道具。若已達上限則不新增。
        /// </summary>
        /// <param name="passive">要新增的被動道具。</param>
        /// <returns>是否成功新增。</returns>
        public bool AddPassive(IPassiveItem passive)
        {
            if (passives.Count >= MaxPassives) return false;
            passives.Add(passive);
            return true;
        }

        /// <summary>
        /// 移除被動道具。
        /// </summary>
        /// <param name="passive">要移除的被動道具。</param>
        /// <returns>是否成功移除。</returns>
        public bool RemovePassive(IPassiveItem passive)
        {
            return passives.Remove(passive);
        }

        /// <summary>
        /// 每幀更新：遍歷所有武器，處理攻擊計時器與自動攻擊。
        /// 無敵人時暫停計時器。
        /// </summary>
        private void Update()
        {
            if (weapons.Count == 0) return;

            Vector2 origin = transform.position;
            Transform nearestEnemy = FindNearestEnemy(origin);

            // 無敵人時暫停所有計時器
            if (nearestEnemy == null) return;

            Vector2 direction = ((Vector2)nearestEnemy.position - origin).normalized;

            for (int i = 0; i < weapons.Count; i++)
            {
                attackTimers[i] += Time.deltaTime;

                float interval = GetAttackInterval(weapons[i]);
                if (attackTimers[i] >= interval)
                {
                    attackTimers[i] = 0f;
                    weapons[i].Attack(origin, direction);
                }
            }
        }

        /// <summary>
        /// 取得武器的攻擊間隔。優先使用等級資料，否則使用設定檔基礎值。
        /// </summary>
        private float GetAttackInterval(IWeapon weapon)
        {
            var config = weapon.Config;
            if (config.levelData != null && config.levelData.Length > 0)
            {
                int index = Mathf.Clamp(weapon.Level - 1, 0, config.levelData.Length - 1);
                return config.levelData[index].attackInterval;
            }
            return config.attackInterval;
        }

        /// <summary>
        /// 搜尋偵測範圍內最近的敵人。
        /// </summary>
        /// <param name="origin">搜尋中心點。</param>
        /// <returns>最近敵人的 Transform；若無敵人則回傳 null。</returns>
        public Transform FindNearestEnemy(Vector2 origin)
        {
            var hits = Physics2D.OverlapCircleAll(origin, detectionRadius, enemyLayer);
            if (hits.Length == 0) return null;

            float closestDist = float.MaxValue;
            Transform closest = null;

            for (int i = 0; i < hits.Length; i++)
            {
                float dist = ((Vector2)hits[i].transform.position - origin).sqrMagnitude;
                if (dist < closestDist)
                {
                    closestDist = dist;
                    closest = hits[i].transform;
                }
            }
            return closest;
        }
    }
}
