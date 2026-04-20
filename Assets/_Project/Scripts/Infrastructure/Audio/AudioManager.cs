using UnityEngine;
using UnityEngine.Audio;
using VampireSurvivors.Core;

namespace VampireSurvivors.Infrastructure
{
    /// <summary>
    /// 音效管理器 — 管理背景音樂（BGM）與音效（SFX）的播放，
    /// 透過 Unity Audio Mixer 控制音量，並訂閱事件匯流排自動播放對應音效。
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        /// <summary>Unity Audio Mixer，用於管理 BGM 與 SFX 通道。</summary>
        [SerializeField] private AudioMixer audioMixer;

        /// <summary>背景音樂音源。</summary>
        [SerializeField] private AudioSource bgmSource;

        /// <summary>音效音源。</summary>
        [SerializeField] private AudioSource sfxSource;

        /// <summary>各地圖對應的背景音樂片段（索引對應地圖索引）。</summary>
        [SerializeField] private AudioClip[] mapBGMClips;

        /// <summary>武器攻擊音效。</summary>
        [SerializeField] private AudioClip attackSFX;

        /// <summary>敵人受擊音效。</summary>
        [SerializeField] private AudioClip enemyHitSFX;

        /// <summary>敵人死亡音效。</summary>
        [SerializeField] private AudioClip enemyDeathSFX;

        /// <summary>玩家受傷音效。</summary>
        [SerializeField] private AudioClip playerHitSFX;

        /// <summary>玩家升級音效。</summary>
        [SerializeField] private AudioClip levelUpSFX;

        /// <summary>Audio Mixer 中 BGM 音量參數名稱。</summary>
        private const string BGMVolumeParam = "BGMVolume";

        /// <summary>Audio Mixer 中 SFX 音量參數名稱。</summary>
        private const string SFXVolumeParam = "SFXVolume";

        /// <summary>音量最小值（dB），對應靜音。</summary>
        private const float MinVolumeDb = -80f;

        /// <summary>音量最大值（dB），對應最大音量。</summary>
        private const float MaxVolumeDb = 0f;

        private void OnEnable()
        {
            EventBus.Subscribe<GameStartEvent>(OnGameStart);
            EventBus.Subscribe<WeaponAttackEvent>(OnWeaponAttack);
            EventBus.Subscribe<EnemyDamagedEvent>(OnEnemyDamaged);
            EventBus.Subscribe<EnemyKilledEvent>(OnEnemyKilled);
            EventBus.Subscribe<PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Subscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameStartEvent>(OnGameStart);
            EventBus.Unsubscribe<WeaponAttackEvent>(OnWeaponAttack);
            EventBus.Unsubscribe<EnemyDamagedEvent>(OnEnemyDamaged);
            EventBus.Unsubscribe<EnemyKilledEvent>(OnEnemyKilled);
            EventBus.Unsubscribe<PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Unsubscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
        }

        /// <summary>
        /// 播放背景音樂。若已有音樂播放中，會先停止再播放新曲目。
        /// </summary>
        /// <param name="clip">要播放的背景音樂片段。</param>
        public void PlayBGM(AudioClip clip)
        {
            if (clip == null) return;
            bgmSource.clip = clip;
            bgmSource.loop = true;
            bgmSource.Play();
        }

        /// <summary>
        /// 播放一次性音效。支援多個音效同時播放。
        /// </summary>
        /// <param name="clip">要播放的音效片段。</param>
        public void PlaySFX(AudioClip clip)
        {
            if (clip == null) return;
            sfxSource.PlayOneShot(clip);
        }

        /// <summary>
        /// 設定背景音樂音量。
        /// </summary>
        /// <param name="volume">音量值，範圍 0（靜音）至 1（最大）。</param>
        public void SetBGMVolume(float volume)
        {
            float db = LinearToDecibel(Mathf.Clamp01(volume));
            audioMixer.SetFloat(BGMVolumeParam, db);
        }

        /// <summary>
        /// 設定音效音量。
        /// </summary>
        /// <param name="volume">音量值，範圍 0（靜音）至 1（最大）。</param>
        public void SetSFXVolume(float volume)
        {
            float db = LinearToDecibel(Mathf.Clamp01(volume));
            audioMixer.SetFloat(SFXVolumeParam, db);
        }

        /// <summary>
        /// 將線性音量值（0-1）轉換為分貝值。
        /// 使用對數映射，0 映射為 -80 dB（靜音），1 映射為 0 dB（最大）。
        /// </summary>
        /// <param name="linear">線性音量值，範圍 0 至 1。</param>
        /// <returns>對應的分貝值。</returns>
        private float LinearToDecibel(float linear)
        {
            if (linear <= 0f) return MinVolumeDb;
            return Mathf.Log10(linear) * 20f;
        }

        /// <summary>
        /// 遊戲開始事件處理 — 依據地圖索引播放對應背景音樂。
        /// </summary>
        private void OnGameStart(GameStartEvent e)
        {
            if (mapBGMClips != null && e.MapIndex >= 0 && e.MapIndex < mapBGMClips.Length)
            {
                PlayBGM(mapBGMClips[e.MapIndex]);
            }
        }

        /// <summary>
        /// 武器攻擊事件處理 — 播放攻擊音效。
        /// </summary>
        private void OnWeaponAttack(WeaponAttackEvent e)
        {
            PlaySFX(attackSFX);
        }

        /// <summary>
        /// 敵人受傷事件處理 — 播放受擊音效。
        /// </summary>
        private void OnEnemyDamaged(EnemyDamagedEvent e)
        {
            PlaySFX(enemyHitSFX);
        }

        /// <summary>
        /// 敵人死亡事件處理 — 播放死亡音效。
        /// </summary>
        private void OnEnemyKilled(EnemyKilledEvent e)
        {
            PlaySFX(enemyDeathSFX);
        }

        /// <summary>
        /// 玩家受傷事件處理 — 播放玩家受傷音效。
        /// </summary>
        private void OnPlayerDamaged(PlayerDamagedEvent e)
        {
            PlaySFX(playerHitSFX);
        }

        /// <summary>
        /// 玩家升級事件處理 — 播放升級音效。
        /// </summary>
        private void OnPlayerLevelUp(PlayerLevelUpEvent e)
        {
            PlaySFX(levelUpSFX);
        }
    }
}
