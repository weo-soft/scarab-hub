import { describe, it, expect, beforeEach } from 'vitest';
import { renderListView } from '../../../src/js/views/listView.js';
import { Scarab } from '../../../src/js/models/scarab.js';

describe('List View Integration', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render list view with Scarabs', () => {
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
      new Scarab({
        id: 'test2',
        name: 'Test Scarab 2',
        dropWeight: 200,
        dropLevel: 68,
        limit: 1,
        dropEnabledd: true,
        chaosValue: 3.0,
        profitabilityStatus: 'not_profitable',
      }),
    ];

    renderListView(container, scarabs);

    expect(container.innerHTML).toContain('Test Scarab 1');
    expect(container.innerHTML).toContain('Test Scarab 2');
    expect(container.innerHTML).toContain('Profitable to Vendor');
    expect(container.innerHTML).toContain('Not Profitable');
  });

  it('should handle empty Scarab array', () => {
    renderListView(container, []);
    expect(container.innerHTML).toContain('No Scarabs to display');
  });
});

