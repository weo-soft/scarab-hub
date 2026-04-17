import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../src/js/utils/canvasUtils.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadImage: vi.fn(() =>
      Promise.resolve({ width: 825, height: 787, complete: true })
    ),
  };
});

import { initGridView, updateGridView } from '../../../src/js/views/gridView.js';
import { Scarab } from '../../../src/js/models/scarab.js';

function createMock2dContext() {
  const store = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
  };
  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'canvas') return { width: 2000, height: 2000 };
      if (prop in target) return target[prop];
      return vi.fn();
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

describe('Grid View Integration', () => {
  let canvas;
  let getContextSpy;

  beforeEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1,
    });
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((type) => {
      if (type === '2d') return createMock2dContext();
      return null;
    });
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    getContextSpy?.mockRestore();
    canvas?.remove();
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

