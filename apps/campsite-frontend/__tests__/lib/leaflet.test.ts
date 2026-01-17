/**
 * @jest-environment jsdom
 */

import L from 'leaflet';

describe('Leaflet Library', () => {
  beforeAll(() => {
    // Mock DOM elements that Leaflet requires
    Object.defineProperty(global, 'Image', {
      value: class {
        width = 0;
        height = 0;
        src = '';
      },
      writable: true,
    });

    // Mock document.createElement for Leaflet's internal usage
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'canvas') {
        // Mock canvas context
        (element as HTMLCanvasElement).getContext = jest.fn(() => ({
          canvas: element,
          fillRect: jest.fn(),
          clearRect: jest.fn(),
          getImageData: jest.fn(),
          putImageData: jest.fn(),
          createImageData: jest.fn(),
          setTransform: jest.fn(),
          drawImage: jest.fn(),
          save: jest.fn(),
          fillText: jest.fn(),
          restore: jest.fn(),
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          closePath: jest.fn(),
          stroke: jest.fn(),
          translate: jest.fn(),
          scale: jest.fn(),
          rotate: jest.fn(),
          arc: jest.fn(),
          fill: jest.fn(),
          measureText: jest.fn(() => ({ width: 0 })),
          transform: jest.fn(),
          rect: jest.fn(),
          clip: jest.fn(),
        })) as unknown as CanvasRenderingContext2D;
      }
      return element;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('can import Leaflet library', () => {
    expect(L).toBeDefined();
    expect(typeof L).toBe('object');
  });

  it('has L.map as a function', () => {
    expect(L.map).toBeDefined();
    expect(typeof L.map).toBe('function');
  });

  it('has L.marker as a function', () => {
    expect(L.marker).toBeDefined();
    expect(typeof L.marker).toBe('function');
  });

  it('has L.tileLayer as a function', () => {
    expect(L.tileLayer).toBeDefined();
    expect(typeof L.tileLayer).toBe('function');
  });

  it('can create a marker instance', () => {
    const marker = L.marker([13.7563, 100.5018]); // Bangkok coordinates
    expect(marker).toBeDefined();
    expect(marker.getLatLng()).toBeDefined();
  });

  it('can create a tile layer instance', () => {
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    });
    expect(tileLayer).toBeDefined();
  });
});
