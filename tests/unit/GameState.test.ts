import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/core/types/GameState';

describe('GameState 列舉', () => {
  it('應該包含所有必要的遊戲狀態', () => {
    expect(GameState.Playing).toBe('playing');
    expect(GameState.Paused).toBe('paused');
    expect(GameState.LevelUp).toBe('levelUp');
    expect(GameState.GameOver).toBe('gameOver');
    expect(GameState.Victory).toBe('victory');
  });

  it('應該有正確的狀態數量', () => {
    const states = Object.values(GameState);
    expect(states).toHaveLength(5);
  });

  it('所有狀態值應該是唯一的', () => {
    const states = Object.values(GameState);
    const uniqueStates = new Set(states);
    expect(uniqueStates.size).toBe(states.length);
  });

  it('應該能夠進行狀態比較', () => {
    let currentState: GameState = GameState.Playing;
    
    expect(currentState).toBe(GameState.Playing);
    expect(currentState).not.toBe(GameState.Paused);
    
    currentState = GameState.Paused;
    expect(currentState).toBe(GameState.Paused);
    expect(currentState).not.toBe(GameState.Playing);
  });

  it('應該能夠在 switch 語句中使用', () => {
    const testState = (state: GameState): string => {
      switch (state) {
        case GameState.Playing:
          return 'game is running';
        case GameState.Paused:
          return 'game is paused';
        case GameState.LevelUp:
          return 'level up screen';
        case GameState.GameOver:
          return 'game over';
        case GameState.Victory:
          return 'victory';
        default:
          return 'unknown';
      }
    };

    expect(testState(GameState.Playing)).toBe('game is running');
    expect(testState(GameState.Paused)).toBe('game is paused');
    expect(testState(GameState.LevelUp)).toBe('level up screen');
    expect(testState(GameState.GameOver)).toBe('game over');
    expect(testState(GameState.Victory)).toBe('victory');
  });
});
