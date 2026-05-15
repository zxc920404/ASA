/**
 * GameState 列舉
 * 
 * 定義遊戲的所有可能狀態
 */
export enum GameState {
  /** 遊戲進行中 */
  Playing = 'playing',
  
  /** 遊戲暫停 */
  Paused = 'paused',
  
  /** 升級選擇畫面 */
  LevelUp = 'levelUp',
  
  /** 遊戲結束（失敗） */
  GameOver = 'gameOver',
  
  /** 遊戲勝利 */
  Victory = 'victory',
}
