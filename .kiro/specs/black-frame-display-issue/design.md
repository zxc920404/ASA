# Black Frame Display Issue Bugfix Design

## Overview

The game displays black frames/borders around the canvas element when rendered in the browser, preventing the canvas from filling the entire viewport. The issue appears to be caused by conflicting CSS constraints on the canvas element in index.html. The canvas has explicit `width: 100vw !important` and `height: 100dvh !important` styles, but the Phaser game configuration uses `Phaser.Scale.RESIZE` mode with `parent: document.body`, which may create a mismatch between the canvas dimensions and the actual game rendering area. The fix will involve aligning the CSS styling with Phaser's scaling behavior to ensure the canvas fills the viewport without black borders.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the game canvas is rendered with CSS constraints that conflict with Phaser's scaling behavior
- **Property (P)**: The desired behavior when the canvas is rendered - the canvas should fill the entire viewport without black frames or borders
- **Preservation**: Existing mobile behaviors (scroll prevention, touch-action, orientation warning, positioning) that must remain unchanged by the fix
- **canvas element**: The HTML canvas element created by Phaser in `index.html` that renders the game
- **Phaser.Scale.RESIZE**: The Phaser scaling mode that dynamically resizes the game to match the parent container dimensions
- **100vw/100dvh**: CSS viewport units that may not account for browser chrome or safe areas on mobile devices

## Bug Details

### Bug Condition

The bug manifests when the game canvas is rendered in the browser with CSS styling that creates dimensional conflicts. The canvas element has explicit `width: 100vw !important` and `height: 100dvh !important` styles, but Phaser's `RESIZE` scale mode with `parent: document.body` may be calculating different dimensions, creating gaps that show the black background.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CanvasRenderContext
  OUTPUT: boolean
  
  RETURN input.canvasElement.style.width = '100vw !important'
         AND input.canvasElement.style.height = '100dvh !important'
         AND input.phaserScaleMode = Phaser.Scale.RESIZE
         AND input.phaserParent = document.body
         AND blackBordersVisible(input.canvasElement)
END FUNCTION
```

### Examples

- **Browser Desktop**: Canvas renders with thin black borders on all sides instead of filling the viewport
- **Mobile Landscape**: Canvas displays with black frames around edges despite viewport-fit=cover meta tag
- **Viewport Resize**: When resizing the browser window, black borders persist instead of canvas expanding to fill space
- **Edge Case**: On mobile devices with notches/safe areas, black borders may appear in addition to safe area insets

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mobile scroll prevention must continue to work (overflow: hidden, touch-action: none)
- Orientation warning overlay must continue to display correctly in portrait mode on mobile
- Canvas absolute positioning at top: 0 and left: 0 must remain unchanged
- Black background color on html and body elements must remain unchanged

**Scope:**
All inputs that do NOT involve the canvas element's width/height styling should be completely unaffected by this fix. This includes:
- Mobile touch interaction settings (touch-action, user-select, tap-highlight)
- Orientation detection and warning display logic
- Viewport meta tag configuration
- Background color styling on html/body elements

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **CSS Override Conflict**: The canvas has `width: 100vw !important` and `height: 100dvh !important`, which may override Phaser's internal canvas sizing calculations
   - Phaser's RESIZE mode expects to control canvas dimensions directly
   - The !important flag prevents Phaser from adjusting canvas size properly

2. **Parent Container Mismatch**: Phaser config uses `parent: document.body`, but the canvas styling uses viewport units (vw/dvh) instead of inheriting from parent
   - This creates a disconnect between Phaser's scale calculations and CSS styling
   - The #app div container is unused by Phaser

3. **Display Block Without Dimensions**: The canvas has `display: block` but may not be properly sized by Phaser when CSS overrides are present
   - The combination of display: block and explicit viewport units may create rendering gaps

4. **Viewport Unit Precision**: Using 100vw/100dvh may not account for sub-pixel rendering or browser chrome
   - This could create small gaps that show the black background

## Correctness Properties

Property 1: Bug Condition - Canvas Fills Viewport Without Black Borders

_For any_ rendering context where the game canvas is displayed in the browser, the fixed CSS styling SHALL allow the canvas to fill the entire viewport without any visible black frames or borders, regardless of viewport size or device type.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Mobile Behavior and Styling

_For any_ CSS styling or JavaScript behavior that does NOT involve the canvas element's width/height properties, the fixed code SHALL produce exactly the same behavior as the original code, preserving mobile scroll prevention, touch-action settings, orientation warning functionality, and background colors.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `index.html`

**Element**: `canvas` style block

**Specific Changes**:
1. **Remove Explicit Viewport Units**: Remove `width: 100vw !important` and `height: 100dvh !important` from canvas styling
   - Let Phaser's RESIZE scale mode control canvas dimensions directly
   - Remove !important flags that prevent Phaser from managing canvas size

2. **Simplify Canvas Styling**: Keep only essential positioning and display properties
   - Maintain `display: block` for proper rendering
   - Maintain `position: absolute`, `top: 0`, `left: 0` for positioning
   - Remove explicit width/height constraints

3. **Ensure Parent Container Sizing**: Verify that document.body (Phaser's parent) is properly sized
   - The existing `width: 100vw; height: 100dvh` on body should be sufficient
   - Phaser will size the canvas to match the parent container

4. **Alternative Approach (if needed)**: If removing viewport units doesn't work, change Phaser parent to #app
   - Update `parent: document.body` to `parent: 'app'` in main.ts
   - Ensure #app container has proper sizing

5. **Test Across Devices**: Verify fix works on desktop browsers, mobile landscape, and mobile portrait (with orientation warning)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write visual regression tests or manual test cases that capture screenshots of the canvas rendering. Run these tests on the UNFIXED code to observe black borders and understand the root cause.

**Test Cases**:
1. **Desktop Browser Test**: Load game in desktop browser at 1920x1080 resolution (will show black borders on unfixed code)
2. **Mobile Landscape Test**: Load game on mobile device in landscape orientation (will show black borders on unfixed code)
3. **Viewport Resize Test**: Resize browser window from 800x600 to 1200x800 (black borders will persist on unfixed code)
4. **Mobile Portrait Test**: Load game on mobile in portrait mode (orientation warning should display, but black borders visible behind it on unfixed code)

**Expected Counterexamples**:
- Black borders visible around canvas edges in all viewport sizes
- Possible causes: CSS viewport units overriding Phaser's canvas sizing, !important flags preventing Phaser control, parent container mismatch

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL viewport WHERE canvasIsRendered(viewport) DO
  result := renderCanvas_fixed(viewport)
  ASSERT canvasFillsViewport(result) AND noBlackBorders(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL styling WHERE NOT canvasWidthHeight(styling) DO
  ASSERT originalStyling(styling) = fixedStyling(styling)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for mobile interactions and orientation warning, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Mobile Scroll Prevention**: Observe that scrolling is prevented on unfixed code, then write test to verify this continues after fix
2. **Touch Action Preservation**: Observe that touch-action: none works correctly on unfixed code, then write test to verify this continues after fix
3. **Orientation Warning Display**: Observe that orientation warning displays in portrait mode on unfixed code, then write test to verify this continues after fix
4. **Background Color Preservation**: Observe that html/body have black background on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test that canvas element exists and is properly positioned (absolute, top: 0, left: 0)
- Test that canvas fills viewport dimensions without explicit vw/dvh units
- Test that mobile meta tags and touch settings remain unchanged
- Test that orientation warning logic continues to work

### Property-Based Tests

- Generate random viewport sizes and verify canvas fills each size without black borders
- Generate random device configurations (mobile/desktop) and verify proper rendering
- Test that all non-canvas CSS properties remain unchanged across many scenarios

### Integration Tests

- Test full game load in desktop browser and verify no black borders
- Test game load on mobile landscape and verify no black borders
- Test viewport resize and verify canvas adjusts without black borders appearing
- Test orientation change from landscape to portrait and verify warning displays correctly
