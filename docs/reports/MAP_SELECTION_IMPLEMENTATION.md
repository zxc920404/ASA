# Map Selection Screen Implementation

## Overview
This document describes the implementation of the map selection screen feature (Task 3.2.3).

## Implementation Details

### New Files Created
1. **src/scenes/MapSelectScene.ts** - Main map selection scene

### Modified Files
1. **src/scenes/CharacterSelectScene.ts** - Updated to navigate to MapSelectScene instead of directly to Game
2. **src/main.ts** - Registered MapSelectScene in the scene list

### Features Implemented

#### 1. Map Selection Screen
- **Location**: `src/scenes/MapSelectScene.ts`
- **Purpose**: Allows players to choose between available maps before starting the game

#### 2. Available Maps
The scene displays two maps:
- **Forest (迷霧森林)** 🌲
  - Difficulty: ★☆☆☆☆
  - Description: Ancient forest with hidden dangers, suitable for beginners
  - Preview Color: Dark green (#2d5016)
  - BGM: bgm-forest

- **Cemetery (荒廢墓地)** ⚰
  - Difficulty: ★★☆☆☆
  - Description: Graveyard with wandering spirits and eerie atmosphere
  - Preview Color: Dark purple (#3a2a4a)
  - BGM: bgm-cemetery

#### 3. UI Components

##### Map Cards
Each map is displayed as a card containing:
- **Preview/Thumbnail**: Visual representation with map-specific color gradient and emoji icon
- **Map Name**: Displayed in Chinese with emoji
- **Difficulty Rating**: Star-based difficulty indicator
- **Description**: Brief description of the map theme
- **Selection Indicator**: Checkmark (✓) for selected map
- **Interactive Hover**: Visual feedback on hover

##### Navigation Buttons
- **Start Battle Button (⚔ 開始戰鬥！)**: Starts the game with selected character and map
- **Back Button (← 返回)**: Returns to character selection screen

#### 4. Responsive Design
- Adapts to different screen sizes and aspect ratios
- Card width: 75% of screen width (max 450px)
- Card height: 160px with dynamic gap
- Text wrapping for descriptions
- Mobile-friendly touch targets

#### 5. Visual Design
- **Background**: Dark gradient (matching game theme)
- **Title**: Green color (#44ff88) with divider line
- **Selected Card**: Highlighted with green border and lighter background
- **Hover Effects**: Interactive feedback for better UX
- **Preview Area**: Rounded corners with gradient background

#### 6. Game Flow Integration
The updated game flow is:
```
Main Menu → Character Select → Map Select → Game
```

When starting the game, both `characterId` and `mapId` are passed to the GameScene:
```typescript
this.scene.start('Game', {
  characterId: this.characterId,
  mapId: this.selectedMapId,
});
```

### Technical Implementation

#### Scene Initialization
```typescript
init(data: { characterId: string }): void {
  this.characterId = data.characterId || 'char_blue_swordsman';
  this.selectedMapId = 'forest'; // Default to forest
}
```

#### Map Data Structure
```typescript
interface MapInfo {
  mapId: string;
  displayName: string;
  description: string;
  difficulty: string;
  previewColor: number;
  bgmKey: string;
}
```

#### Responsive Rendering
The scene uses Phaser's scale manager to handle window resizing:
```typescript
this.scale.on('resize', () => this.drawAll());
```

### Testing
Unit tests have been created in `tests/unit/MapSelectScene.test.ts` covering:
- Scene initialization
- Map data availability
- Navigation flow
- Responsive design
- Game start with correct parameters

### Mobile Compatibility
- Touch-friendly card selection
- Responsive layout for different screen sizes
- Proper button sizing for mobile devices
- Visual feedback for touch interactions

### Future Enhancements
Potential improvements for future iterations:
1. Add actual map preview images/screenshots
2. Display map-specific statistics (enemy types, special features)
3. Add map unlock system (locked/unlocked maps)
4. Show player's best time/score for each map
5. Add map difficulty modifiers
6. Implement map-specific achievements

## Verification
To verify the implementation:
1. Start the game
2. Navigate to Character Selection
3. Select a character
4. The Map Selection screen should appear
5. Select a map (Forest or Cemetery)
6. Click "Start Battle" to begin the game with the selected map

The GameScene should receive both `characterId` and `mapId` parameters and load the appropriate map and background music.
