import { describe, it, expect, beforeEach } from 'vitest';
import { initGridView, updateGridView } from '../../../src/js/views/gridView.js';
import { Scarab } from '../../../src/js/models/scarab.js';

describe('Grid View Integration', () => {
  let canvas;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  });

  it('should initialize grid view with canvas', async () => {
    const scarabs = [
      new Scarab({
        id: 'test1',
        name: 'Test Scarab 1',
        dropWeight: 100,
        dropLevel: 68,
        limit: 1,
        dropEnabledd: true,
        chaosValue: 1.0,
        profitabilityStatus: 'profitable',
      }),
    ];

    // Initialize without image (will use fallback)
    await initGridView(canvas, scarabs, null);

    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('should update grid view with new data', async () => {
    const scarabs1 = [
      new Scarab({
        id: 'test1',
        name: 'Test 1',
        dropWeight: 100,
        dropLevel: 68,
        limit: 1,
        dropEnabledd: true,
        chaosValue: 1.0,
        profitabilityStatus: 'profitable',
      }),
    ];

    await initGridView(canvas, scarabs1, null);

    const scarabs2 = [
      ...scarabs1,
      new Scarab({
        id: 'test2',
        name: 'Test 2',
        dropWeight: 200,
        dropLevel: 68,
        limit: 1,
        dropEnabledd: true,
        chaosValue: 2.0,
        profitabilityStatus: 'not_profitable',
      }),
    ];

    await updateGridView(canvas, scarabs2);
    expect(canvas.width).toBeGreaterThan(0);
  });
});

