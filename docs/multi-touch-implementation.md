# Multi-Touch Support Implementation

## Task 4.2.3: 支援多點觸控（以 pointerId 追蹤搖桿觸控）

### Overview

The `TouchInputAdapter` implements multi-touch support to allow simultaneous joystick control and UI interactions. This is achieved by tracking the specific pointer ID that controls the joystick, ensuring other touch points don't interfere.

### Implementation Details

#### 1. Pointer ID Tracking

The adapter uses the `activePointerId` field to track which touch point controls the joystick:

```typescript
private activePointerId: number = -1;
```

- When the joystick is not active, `activePointerId` is `-1`
- When a touch activates the joystick, `activePointerId` is set to that pointer's ID
- Only events from the tracked pointer ID affect the joystick

#### 2. Joystick Activation

The joystick activates only when:
1. Touch occurs on the left half of the screen (`pointer.x < this.scene.scale.width / 2`)
2. The joystick is not already active (`!this.isActive`)

```typescript
this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  if (pointer.x < this.scene.scale.width / 2 && !this.isActive) {
    this.isActive = true;
    this.activePointerId = pointer.id;
    // ... show joystick
  }
});
```

#### 3. Pointer Move Filtering

Only pointer move events from the tracked pointer ID update the joystick:

```typescript
this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
  if (!this.isActive || pointer.id !== this.activePointerId) return;
  // ... update joystick position and direction
});
```

#### 4. Pointer Release Filtering

The joystick deactivates only when the tracked pointer is released:

```typescript
this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
  if (pointer.id === this.activePointerId) {
    this.isActive = false;
    this.activePointerId = -1;
    // ... hide joystick
  }
});
```

### Multi-Touch Scenarios

#### Scenario 1: Joystick + UI Button

1. User touches left side → Joystick activates (pointer ID 0)
2. User touches right side → UI button receives event (pointer ID 1)
3. Both interactions work independently
4. Releasing either touch doesn't affect the other

#### Scenario 2: Multiple Left-Side Touches

1. User touches left side → Joystick activates (pointer ID 0)
2. User touches left side again → Second touch is ignored (pointer ID 1)
3. Only the first touch controls the joystick
4. This prevents accidental joystick interference

#### Scenario 3: UI Button First, Then Joystick

1. User touches right side → UI button receives event (pointer ID 0)
2. User touches left side → Joystick activates (pointer ID 1)
3. Both work independently
4. Order doesn't matter

### Benefits

1. **Isolated Joystick Control**: Only the designated pointer controls the joystick
2. **Simultaneous UI Interaction**: Users can tap UI buttons while moving
3. **No Interference**: Multiple touches don't cause unexpected joystick behavior
4. **Natural Feel**: Matches user expectations for mobile game controls

### Testing

Comprehensive tests verify:
- Pointer ID tracking works correctly
- Other pointers don't interfere with joystick
- Joystick releases only on correct pointer up
- Multiple concurrent touches are handled properly
- UI interactions work alongside joystick

See `tests/unit/TouchInputAdapter.multitouch.test.ts` for detailed test cases.

### Phaser Input System

Phaser's input system automatically supports multi-touch:
- Each touch point gets a unique `pointer.id`
- Multiple pointers can be active simultaneously
- Events fire for each pointer independently
- **Configuration**: By default, Phaser creates 2 pointers. For games requiring more simultaneous touches, configure `activePointers` in the game config:

```typescript
const config: Phaser.Types.Core.GameConfig = {
  // ... other config
  input: {
    activePointers: 3, // Support up to 3 simultaneous touches
  },
};
```

The implementation leverages this built-in support by simply filtering events based on pointer ID.

### Configuration

In `src/main.ts`, the game is configured to support up to 3 simultaneous touches:
- 1 for joystick control (left side)
- 2 for UI interactions (right side)

This provides enough capacity for typical gameplay scenarios while maintaining good performance.
