# Permanent Upgrade Interface - Visual Design Documentation

## Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ⚔ 小俠想要活下去                            │
│                Wuxia Survivors                          │
│         ─────────────────────────────                   │
│                                                         │
│                  💎 永久升級                             │
│                    🪙 1000                              │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ 生命強化                              100🪙   │     │
│  │ Lv 0/10                                      │     │
│  │ 每級 +10 最大生命值                           │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ 攻擊強化                              150🪙   │     │
│  │ Lv 0/10                                      │     │
│  │ 每級 +5% 攻擊力                               │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ 速度強化                              100🪙   │     │
│  │ Lv 0/10                                      │     │
│  │ 每級 +5% 移動速度                             │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ 經驗強化                              120🪙   │     │
│  │ Lv 0/10                                      │     │
│  │ 每級 +10% 經驗值獲取                          │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ 拾取強化                               80🪙   │     │
│  │ Lv 0/10                                      │     │
│  │ 每級 +15 拾取範圍                             │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│                    ← 返回                               │
│                                                         │
│                                          v0.1.0         │
└─────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Header Section
- **Title**: "💎 永久升級"
  - Font size: 20px
  - Color: #ffdd00 (gold)
  - Position: Center, 19% from top

- **Gold Display**: "🪙 {amount}"
  - Font size: 14px
  - Color: #ffdd00 (gold)
  - Position: Center, 24% from top
  - Updates in real-time after purchases

### 2. Upgrade Cards (x5)

#### Card Container
- **Dimensions**: 
  - Width: `Math.min(w * 0.65, 320)` (responsive)
  - Height: 52px
- **Background**: #1a1a3a with 90% opacity
- **Border**: 1px solid
  - Normal: #333355
  - Maxed: #44aa44 (green)
- **Spacing**: 60px gap between cards (responsive)

#### Card Content Layout
```
┌─────────────────────────────────────────────────┐
│ [Name]                              [Button]    │  ← Top: -12px
│ [Level]                                         │  ← Middle: +2px
│ [Description]                                   │  ← Bottom: +14px
└─────────────────────────────────────────────────┘
```

#### Text Elements

**Upgrade Name** (Top Left)
- Font size: 13px
- Font style: bold
- Color: 
  - Normal: #ffffff (white)
  - Maxed: #44ff44 (bright green)
- Position: Left aligned, -12px from center

**Level Indicator** (Middle Left)
- Format: "Lv {current}/{max}"
- Font size: 10px
- Color: #999999 (gray)
- Position: Left aligned, +2px from center

**Description** (Bottom Left)
- Font size: 8px
- Color: #888888 (light gray)
- Position: Left aligned, +14px from center
- Examples:
  - "每級 +10 最大生命值"
  - "每級 +5% 攻擊力"
  - "每級 +5% 移動速度"
  - "每級 +10% 經驗值獲取"
  - "每級 +15 拾取範圍"

### 3. Purchase Button (Right Side)

#### Active Button (Can Purchase)
- **Dimensions**: 60x36 pixels
- **Background**: #336633 (dark green)
- **Border**: 1px solid #44aa44 (bright green)
- **Text**: "{cost}🪙"
  - Font size: 10px
  - Color: #ffffff (white)
- **Hover Effect**:
  - Background: #44aa44 (brighter green)
- **Interactive**: Yes (cursor: pointer)

#### Disabled Button (Insufficient Gold)
- **Dimensions**: 60x36 pixels
- **Background**: #333333 (dark gray)
- **Border**: 1px solid #444444 (gray)
- **Text**: "{cost}🪙"
  - Font size: 10px
  - Color: #666666 (dark gray)
- **Interactive**: No

#### MAX Indicator (Fully Upgraded)
- **Text**: "MAX"
- **Font size**: 11px
- **Color**: #44ff44 (bright green)
- **Position**: Right side, centered
- **No button background**

### 4. Back Button
- **Text**: "← 返回"
- **Dimensions**: 120x32 pixels
- **Position**: Center, 82% from top
- **Style**: Same as main menu buttons
- **Action**: Returns to main menu panel

## Color Palette

### Primary Colors
- **Gold**: #ffdd00 (titles, gold display)
- **White**: #ffffff (text)
- **Dark Purple**: #1a1a3a (card background)
- **Purple Border**: #333355 (normal card border)

### Success Colors
- **Green**: #44aa44 (maxed border, button border)
- **Bright Green**: #44ff44 (maxed text, MAX indicator)
- **Dark Green**: #336633 (purchase button)

### Disabled Colors
- **Dark Gray**: #333333 (disabled button)
- **Gray**: #666666 (disabled text)
- **Light Gray**: #888888 (description)
- **Medium Gray**: #999999 (level indicator)

## Responsive Behavior

### Desktop (1920x1080)
- Card width: 320px (max)
- Gap: 60px (max)
- All text fully visible
- Hover effects active

### Tablet (768x1024)
- Card width: ~500px (65% of width)
- Gap: ~60px
- All text fully visible
- Touch-friendly targets

### Mobile (375x667)
- Card width: ~244px (65% of width)
- Gap: ~48px (12% of height)
- Text may wrap if needed
- Touch-optimized (48x48+ targets)

## Interaction States

### 1. Normal State
- Card: Dark purple background
- Button: Dark green (if can purchase) or dark gray (if cannot)
- Text: White/gray colors

### 2. Hover State (Desktop)
- Button background: Brighter green
- Cursor: Pointer
- No other changes

### 3. Active/Press State
- Button: Slightly darker
- Brief visual feedback
- Triggers purchase action

### 4. Maxed State
- Card border: Green
- Name text: Bright green
- Button replaced with "MAX" text

### 5. After Purchase
- Entire panel redraws
- Gold amount updates
- Level increments
- Next cost displays
- Smooth transition

## Upgrade Types Detail

### 1. 生命強化 (Max HP)
- **Stat**: maxHP
- **Type**: Flat
- **Value**: +10 per level
- **Max Level**: 10
- **Total Bonus**: +100 HP at max
- **Cost Progression**: 100, 200, 400, 600, 900, 1200, 1600, 2000, 2500, 3000

### 2. 攻擊強化 (Attack Power)
- **Stat**: attackPower
- **Type**: Percent
- **Value**: +5% per level
- **Max Level**: 10
- **Total Bonus**: +50% attack at max
- **Cost Progression**: 150, 300, 500, 750, 1000, 1400, 1800, 2300, 2800, 3500

### 3. 速度強化 (Move Speed)
- **Stat**: moveSpeed
- **Type**: Percent
- **Value**: +5% per level
- **Max Level**: 10
- **Total Bonus**: +50% speed at max
- **Cost Progression**: 100, 200, 350, 500, 700, 950, 1200, 1500, 1900, 2400

### 4. 經驗強化 (XP Gain)
- **Stat**: xpGain
- **Type**: Percent
- **Value**: +10% per level
- **Max Level**: 10
- **Total Bonus**: +100% XP at max
- **Cost Progression**: 120, 250, 400, 600, 850, 1100, 1400, 1800, 2200, 2800

### 5. 拾取強化 (Pickup Range)
- **Stat**: pickupRange
- **Type**: Flat
- **Value**: +15 per level
- **Max Level**: 10
- **Total Bonus**: +150 range at max
- **Cost Progression**: 80, 160, 300, 450, 650, 900, 1150, 1450, 1800, 2200

## Accessibility Features

### Touch Targets
- All buttons: Minimum 48x48 pixels
- Purchase buttons: 60x36 pixels (meets minimum)
- Card height: 52 pixels (adequate spacing)
- Gap between cards: 60px (prevents mis-taps)

### Visual Feedback
- Hover effects (desktop)
- Press effects (mobile)
- Color changes on interaction
- Clear disabled state (grayed out)
- Success state (green for maxed)

### Readability
- High contrast text
- Multiple font sizes for hierarchy
- Bold for important text (names)
- Icons for visual recognition (🪙, 💎)

## Data Persistence

### Save Structure
```json
{
  "gold": 1000,
  "permanentUpgradeLevels": [0, 0, 0, 0, 0],
  "unlockedCharacterIds": ["char_swordsman"],
  "settings": {
    "musicVolume": 0.7,
    "sfxVolume": 1.0
  },
  "appVersion": "0.1.0"
}
```

### Storage Location
- **Key**: `'vampire_survivors_save'`
- **Provider**: localStorage
- **Format**: JSON string
- **Validation**: Automatic corruption detection
- **Fallback**: Default save if corrupted

## Animation & Transitions

### Current Implementation
- Instant redraw on purchase
- No animations (for performance)
- Smooth resize handling

### Future Enhancements
- Fade in/out on purchase
- Number count-up animation
- Particle effects on upgrade
- Sound effects on purchase

---

**Design Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Implemented
