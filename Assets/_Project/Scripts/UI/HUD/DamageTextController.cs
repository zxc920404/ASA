using UnityEngine;
using TMPro;
using VampireSurvivors.Core;

namespace VampireSurvivors.UI
{
    /// <summary>
    /// 傷害數字控制器 — 管理傷害數字浮動文字的生成與動畫。
    /// 傷害數字從受擊位置向上飄散並淡出，透過 Object Pool 管理。
    /// </summary>
    public class DamageTextController : MonoBehaviour
    {
        /// <summary>物件池管理器。</summary>
        [SerializeField] private ObjectPoolManager poolManager;

        /// <summary>傷害數字物件池識別碼。</summary>
        [SerializeField] private string damageTextPoolId = "damage_text";

        /// <summary>向上飄散速度。</summary>
        [SerializeField] private float floatSpeed = 1.5f;

        /// <summary>淡出持續時間。</summary>
        [SerializeField] private float fadeDuration = 0.8f;

        /// <summary>水平隨機偏移範圍。</summary>
        [SerializeField] private float horizontalSpread = 0.3f;

        private void OnEnable()
        {
            EventBus.Subscribe<EnemyDamagedEvent>(OnEnemyDamaged);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<EnemyDamagedEvent>(OnEnemyDamaged);
        }

        /// <summary>
        /// 敵人受傷時生成傷害數字。
        /// </summary>
        private void OnEnemyDamaged(EnemyDamagedEvent e)
        {
            SpawnDamageText(e.Position, e.Damage);
        }

        /// <summary>
        /// 從 Object Pool 取出傷害數字物件並初始化。
        /// </summary>
        /// <param name="worldPos">受擊世界座標。</param>
        /// <param name="damage">傷害數值。</param>
        public void SpawnDamageText(Vector2 worldPos, float damage)
        {
            if (poolManager == null) return;

            GameObject obj = poolManager.Spawn(damageTextPoolId, worldPos);
            var floater = obj.GetComponent<DamageTextFloater>();
            if (floater != null)
            {
                floater.Initialize(
                    damage, floatSpeed, fadeDuration, horizontalSpread,
                    poolManager, damageTextPoolId);
            }
        }
    }

    /// <summary>
    /// 傷害數字浮動元件 — 掛載於傷害數字 Prefab 上，
    /// 控制向上飄散與淡出動畫，動畫結束後自動回收至 Object Pool。
    /// </summary>
    public class DamageTextFloater : MonoBehaviour
    {
        /// <summary>文字元件。</summary>
        [SerializeField] private TextMeshPro textMesh;

        /// <summary>飄散方向。</summary>
        private Vector2 floatDirection;

        /// <summary>飄散速度。</summary>
        private float speed;

        /// <summary>淡出持續時間。</summary>
        private float duration;

        /// <summary>已經過時間。</summary>
        private float elapsed;

        /// <summary>初始顏色。</summary>
        private Color startColor;

        /// <summary>物件池管理器參考。</summary>
        private ObjectPoolManager pool;

        /// <summary>物件池識別碼。</summary>
        private string poolId;

        /// <summary>
        /// 初始化傷害數字動畫參數。
        /// </summary>
        public void Initialize(
            float damage, float floatSpeed, float fadeDuration,
            float horizontalSpread, ObjectPoolManager poolManager, string damageTextPoolId)
        {
            if (textMesh == null)
                textMesh = GetComponent<TextMeshPro>();

            if (textMesh != null)
            {
                textMesh.text = Mathf.RoundToInt(damage).ToString();
                startColor = textMesh.color;
                startColor.a = 1f;
                textMesh.color = startColor;
            }

            float hOffset = Random.Range(-horizontalSpread, horizontalSpread);
            floatDirection = new Vector2(hOffset, 1f).normalized;
            speed = floatSpeed;
            duration = fadeDuration;
            elapsed = 0f;
            pool = poolManager;
            poolId = damageTextPoolId;
        }

        private void Update()
        {
            elapsed += Time.deltaTime;

            // 向上飄散
            transform.position += (Vector3)(floatDirection * speed * Time.deltaTime);

            // 淡出
            if (textMesh != null)
            {
                float alpha = Mathf.Clamp01(1f - elapsed / duration);
                textMesh.color = new Color(startColor.r, startColor.g, startColor.b, alpha);
            }

            // 動畫結束，回收至 Object Pool
            if (elapsed >= duration && pool != null)
            {
                pool.Despawn(poolId, gameObject);
            }
        }
    }
}
