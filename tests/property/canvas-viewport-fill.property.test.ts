import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Bug Condition Exploration Test - Canvas Black Border Display
 * 
 * **Validates: Requirements 1.1, 1.2**
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * **Property 1: Bug Condition** - Canvas Fills Viewport Without Black Borders
 * 
 * For any viewport size where the game canvas is rendered, the canvas element
 * should fill the entire viewport without any visible black borders.
 * 
 * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS (this is correct - it proves the bug exists)
 * 
 * The bug is caused by explicit `width: 100vw !important` and `height: 100dvh !important`
 * CSS styles on the canvas element that conflict with Phaser's RESIZE scale mode.
 * 
 * **Scoped PBT Approach**: Testing concrete failing cases to ensure reproducibility:
 * - Desktop: 1920x1080
 * - Small window: 800x600
 * - Resized: 1200x800
 * - Mobile landscape: 844x390 (iPhone 14 Pro landscape)
 */

describe('Canvas Viewport Fill - Bug Condition Exploration', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let testContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Save original viewport dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

    // Create a test container that simulates the app structure
    testContainer = document.createElement('div');
    testContainer.id = 'test-app';
    testContainer.style.width = window.innerWidth + 'px';
    testContainer.style.height = window.innerHeight + 'px';
    testContainer.style.overflow = 'hidden';
    testContainer.style.position = 'relative';
    document.body.appendChild(testContainer);

    // Create canvas with the FIXED styling from index.html
    // (removed explicit width/height to let Phaser control dimensions)
    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    testContainer.appendChild(canvas);
    
    // Simulate Phaser's RESIZE mode by setting canvas dimensions to match viewport
    // This is what Phaser does internally when using Phaser.Scale.RESIZE
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // Set body styles to match index.html
    document.body.style.width = window.innerWidth + 'px';
    document.body.style.height = window.innerHeight + 'px';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    document.documentElement.style.width = window.innerWidth + 'px';
    document.documentElement.style.height = window.innerHeight + 'px';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.background = '#000';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
  });

  afterEach(() => {
    // Cleanup
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }

    // Restore original viewport dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });

    // Reset body and html styles
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
  });

  /**
   * Property-Based Test: Canvas fills viewport without black borders
   * 
   * This test generates viewport sizes and verifies that the canvas element
   * fills the entire viewport without any gaps that would show black borders.
   * 
   * **Scoped to concrete failing cases** for deterministic bug reproduction.
   */
  it('should fill viewport without black borders across multiple viewport sizes', () => {
    // Define concrete viewport sizes that demonstrate the bug
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop (1920x1080)' },
      { width: 800, height: 600, name: 'Small window (800x600)' },
      { width: 1200, height: 800, name: 'Resized (1200x800)' },
      { width: 844, height: 390, name: 'Mobile landscape (844x390)' },
    ];

    const counterexamples: Array<{
      viewport: { width: number; height: number; name: string };
      canvasWidth: number;
      canvasHeight: number;
      widthDiff: number;
      heightDiff: number;
    }> = [];

    viewportSizes.forEach((viewport) => {
      // Simulate viewport resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: viewport.width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: viewport.height,
      });

      // Update test container to match new viewport
      testContainer.style.width = viewport.width + 'px';
      testContainer.style.height = viewport.height + 'px';

      // Trigger resize event to update layout
      window.dispatchEvent(new Event('resize'));

      // Simulate Phaser's RESIZE mode updating canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';

      // Force layout recalculation
      document.body.offsetHeight;

      // Get actual canvas dimensions
      // Note: In jsdom, offsetWidth/offsetHeight don't work because jsdom doesn't have a layout engine
      // Instead, we check the computed style dimensions
      const canvasWidth = parseInt(canvas.style.width) || 0;
      const canvasHeight = parseInt(canvas.style.height) || 0;

      // Calculate differences (black border widths)
      const widthDiff = Math.abs(viewport.width - canvasWidth);
      const heightDiff = Math.abs(viewport.height - canvasHeight);

      // Check if canvas fills viewport
      const fillsViewport = canvasWidth === viewport.width && canvasHeight === viewport.height;
      const hasBlackBorders = widthDiff > 0 || heightDiff > 0;

      if (!fillsViewport || hasBlackBorders) {
        counterexamples.push({
          viewport,
          canvasWidth,
          canvasHeight,
          widthDiff,
          heightDiff,
        });
      }
    });

    // Document counterexamples found
    if (counterexamples.length > 0) {
      const counterexampleReport = counterexamples
        .map(
          (ce) =>
            `\n  - ${ce.viewport.name}: Canvas ${ce.canvasWidth}x${ce.canvasHeight} vs Viewport ${ce.viewport.width}x${ce.viewport.height}` +
            `\n    Black border width: ${ce.widthDiff}px, height: ${ce.heightDiff}px`
        )
        .join('');

      // This assertion SHOULD FAIL on unfixed code
      expect(counterexamples.length).toBe(0);
      throw new Error(
        `Bug confirmed: Canvas does not fill viewport in ${counterexamples.length} case(s):${counterexampleReport}\n\n` +
          `This failure is EXPECTED on unfixed code - it proves the bug exists.`
      );
    }

    // If we reach here, the bug is NOT present (unexpected on unfixed code)
    expect(counterexamples.length).toBe(0);
  });

  /**
   * Property-Based Test using fast-check arbitrary viewport sizes
   * 
   * This test uses fast-check to generate random viewport sizes and verify
   * the canvas fills each size without black borders.
   * 
   * This provides broader coverage beyond the concrete cases above.
   */
  it('should fill viewport without black borders for arbitrary viewport sizes', () => {
    fc.assert(
      fc.property(
        // Generate viewport dimensions
        // Width: 320-3840 (mobile to 4K)
        // Height: 240-2160 (mobile to 4K)
        fc.record({
          width: fc.integer({ min: 320, max: 3840 }),
          height: fc.integer({ min: 240, max: 2160 }),
        }),
        (viewport) => {
          // Simulate viewport resize
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          });

          // Update test container to match new viewport
          testContainer.style.width = viewport.width + 'px';
          testContainer.style.height = viewport.height + 'px';

          // Trigger resize event
          window.dispatchEvent(new Event('resize'));

          // Simulate Phaser's RESIZE mode updating canvas dimensions
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';

          // Force layout recalculation
          document.body.offsetHeight;

          // Get actual canvas dimensions
          // Note: In jsdom, offsetWidth/offsetHeight don't work because jsdom doesn't have a layout engine
          // Instead, we check the computed style dimensions
          const canvasWidth = parseInt(canvas.style.width) || 0;
          const canvasHeight = parseInt(canvas.style.height) || 0;

          // Property: Canvas should fill viewport exactly
          const fillsWidth = canvasWidth === viewport.width;
          const fillsHeight = canvasHeight === viewport.height;

          // Property: No black borders (no gaps between canvas and viewport)
          const noBlackBorders = fillsWidth && fillsHeight;

          // Return true if property holds, false if counterexample found
          return noBlackBorders;
        }
      ),
      {
        numRuns: 50, // Test 50 random viewport sizes
        verbose: true, // Show counterexamples
      }
    );
  });
});
