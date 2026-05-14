# Permanent Upgrade Interface - Manual Test Checklist

## Task 3.2.4: 實作永久升級介面（5 種升級屬性、金幣扣除）

### Test Environment
- Open the game in browser: http://localhost:3000
- Navigate to Main Menu → 永久升級 (Permanent Upgrades)

### Test Cases

#### ✅ 1. Display 5 Upgrade Types
**Expected**: Interface shows exactly 5 upgrade types
- [ ] 生命強化 (Max HP) - visible
- [ ] 攻擊強化 (Attack Power) - visible
- [ ] 速度強化 (Move Speed) - visible
- [ ] 經驗強化 (XP Gain) - visible
- [ ] 拾取強化 (Pickup Range) - visible

#### ✅ 2. Show Current Level and Cost
**Expected**: Each upgrade card displays:
- [ ] Upgrade name (e.g., "生命強化")
- [ ] Current level (e.g., "Lv 0/10")
- [ ] Description (e.g., "每級 +10 最大生命值")
- [ ] Cost button with gold amount (e.g., "100🪙") OR "MAX" if maxed

#### ✅ 3. Coin Deduction
**Test Steps**:
1. Note current gold amount at top of screen
2. Click on an upgrade button (if you have enough gold)
3. Verify gold amount decreases by the cost shown
4. Verify upgrade level increases by 1

**Expected**:
- [ ] Gold decreases by exact cost amount
- [ ] Upgrade level increases from X to X+1
- [ ] New cost is displayed for next level
- [ ] Cannot purchase if insufficient gold (button grayed out)

#### ✅ 4. Save Progress
**Test Steps**:
1. Purchase one or more upgrades
2. Close the browser tab
3. Reopen the game at http://localhost:3000
4. Navigate back to 永久升級

**Expected**:
- [ ] Gold amount persists
- [ ] Upgrade levels persist
- [ ] All progress is maintained

#### ✅ 5. Responsive Design for Mobile
**Test Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

**Expected**:
- [ ] All upgrade cards are visible and properly sized
- [ ] Text is readable at all sizes
- [ ] Buttons are touch-friendly (minimum 48x48 pixels)
- [ ] No overlapping elements
- [ ] Proper spacing between cards
- [ ] Gold display is visible
- [ ] Back button is accessible

#### ✅ 6. Additional UX Features
**Expected**:
- [ ] Hover effect on purchase buttons (desktop)
- [ ] Visual feedback when clicking buttons
- [ ] Maxed upgrades show "MAX" indicator in green
- [ ] Maxed upgrades have green border
- [ ] Insufficient gold shows grayed out button
- [ ] Smooth transition when purchasing (redraw)

### Implementation Details Verified

#### Code Structure
- ✅ MainMenuScene has `drawUpgrades()` method
- ✅ PermanentUpgradeSystem manages upgrade logic
- ✅ SaveSystem persists data to localStorage
- ✅ PERMANENT_UPGRADES array defines 5 upgrades

#### Responsive Design
- ✅ Uses relative positioning (w, h variables)
- ✅ Has resize handler: `scale.on('resize')`
- ✅ Card width: `Math.min(w * 0.65, 320)`
- ✅ Gap: `Math.min(h * 0.12, 60)`
- ✅ Button size: minimum 60x36 pixels (improved from 56x26)
- ✅ Card height: 52 pixels (improved from 38)

#### Data Flow
- ✅ Gold stored in SaveData.gold
- ✅ Upgrade levels in SaveData.permanentUpgradeLevels[]
- ✅ Purchase deducts gold and increments level
- ✅ Changes saved to localStorage immediately

### Test Results

Date: ___________
Tester: ___________

| Test Case | Pass | Fail | Notes |
|-----------|------|------|-------|
| 5 Upgrade Types | [ ] | [ ] | |
| Level & Cost Display | [ ] | [ ] | |
| Coin Deduction | [ ] | [ ] | |
| Save Progress | [ ] | [ ] | |
| Responsive Design | [ ] | [ ] | |
| UX Features | [ ] | [ ] | |

### Issues Found
(List any issues discovered during testing)

1. 
2. 
3. 

### Conclusion
- [ ] All requirements met
- [ ] Task 3.2.4 complete
- [ ] Ready for production
