# Task 3.2.5 Verification Checklist

## Visual Testing Instructions

### 1. Access Settings Screen
- [ ] Open the game in browser (http://localhost:3001)
- [ ] Click "⚙ 設定" button from main menu
- [ ] Settings screen should display with title "⚙ 設定"

### 2. Music Volume Slider
- [ ] Slider displays "🎵 音樂: X%" label
- [ ] Initial value shows 70% (default)
- [ ] Slider thumb is large and easy to grab (32px diameter)
- [ ] Drag thumb left/right to adjust volume
- [ ] Percentage updates in real-time (0-100%)
- [ ] Click anywhere on track to jump to that position
- [ ] Hover over thumb shows visual feedback (white color, scale up)
- [ ] If menu BGM is playing, volume changes immediately

### 3. SFX Volume Slider
- [ ] Slider displays "🔊 音效: X%" label
- [ ] Initial value shows 100% (default)
- [ ] Slider thumb is large and easy to grab (32px diameter)
- [ ] Drag thumb left/right to adjust volume
- [ ] Percentage updates in real-time (0-100%)
- [ ] Click anywhere on track to jump to that position
- [ ] Hover over thumb shows visual feedback (white color, scale up)
- [ ] If UI click sound exists, plays at adjusted volume

### 4. Touch-Friendly Design (Mobile Testing)
- [ ] Open on mobile device or use browser dev tools mobile emulation
- [ ] Thumb is easy to tap and drag (32px diameter)
- [ ] Effective touch target is 48px (thumb + padding)
- [ ] Track is wide enough for easy interaction (50% screen width)
- [ ] No accidental touches on nearby UI elements
- [ ] Smooth dragging without lag

### 5. Responsive Design
**Mobile (320px width):**
- [ ] Slider width = 160px (50% of screen)
- [ ] All elements visible and accessible
- [ ] No horizontal scrolling

**Tablet (768px width):**
- [ ] Slider width = 240px (max width)
- [ ] Comfortable spacing between elements

**Desktop (1920px width):**
- [ ] Slider width = 240px (max width)
- [ ] Centered layout looks good

### 6. Save Functionality
- [ ] Adjust music volume to 50%
- [ ] Adjust SFX volume to 80%
- [ ] Click "← 返回" to return to main menu
- [ ] Refresh the page (F5)
- [ ] Go back to settings
- [ ] Music volume should still be 50%
- [ ] SFX volume should still be 80%

### 7. Immediate Volume Application
**Music:**
- [ ] If menu BGM is playing, adjust music slider
- [ ] Volume should change immediately (no delay)
- [ ] No need to restart or confirm

**SFX:**
- [ ] Adjust SFX slider
- [ ] If UI click sound exists, should play at new volume
- [ ] Demonstrates immediate volume change

### 8. Back Button
- [ ] Click "← 返回" button
- [ ] Should return to main menu
- [ ] Button is touch-friendly (48px height)
- [ ] Visual feedback on hover/press

### 9. Edge Cases
- [ ] Set music volume to 0% - should be silent
- [ ] Set music volume to 100% - should be full volume
- [ ] Set SFX volume to 0% - should be silent
- [ ] Set SFX volume to 100% - should be full volume
- [ ] Drag slider beyond edges - should clamp to 0-100%

### 10. Cross-Browser Testing
- [ ] Chrome - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work
- [ ] Edge - all features work
- [ ] Mobile Chrome - touch works correctly
- [ ] Mobile Safari - touch works correctly

## Automated Test Results

Run: `npm test -- MainMenuScene.test.ts --run`

Expected results:
- [ ] ✓ should have version defined in package.json
- [ ] ✓ should display version in correct format
- [ ] ✓ should use semantic versioning
- [ ] ✓ should have music volume slider range 0-100%
- [ ] ✓ should have SFX volume slider range 0-100%
- [ ] ✓ should save volume settings to SaveData
- [ ] ✓ should have touch-friendly slider thumb size
- [ ] ✓ should apply volume changes immediately
- [ ] ✓ should have responsive slider width for mobile

## Performance Testing

- [ ] No lag when dragging sliders
- [ ] No memory leaks (check dev tools)
- [ ] Smooth animations (60 FPS)
- [ ] Quick save/load operations

## Accessibility Testing

- [ ] Slider labels are clear and readable
- [ ] Percentage values are visible
- [ ] Color contrast is sufficient
- [ ] Touch targets meet 48x48 guideline

## Known Limitations

1. **Menu BGM**: Will be silent if `bgm-menu` audio file is not loaded
2. **Test SFX**: Will be silent if `sfx-ui-click` audio file is not loaded
3. **Volume Preview**: Only works if audio files are available

## Next Steps

If all checks pass:
- [ ] Mark task 3.2.5 as complete
- [ ] Proceed to next task in implementation plan
- [ ] Consider adding actual audio files for better testing

If issues found:
- [ ] Document issues in bug tracker
- [ ] Fix critical issues before marking complete
- [ ] Update implementation as needed
