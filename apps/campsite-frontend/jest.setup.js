import '@testing-library/jest-dom';

// Polyfill for hasPointerCapture (jsdom issue)
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function() {
    return false;
  };
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function() {};
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function() {};
}

// Polyfill for scrollIntoView (jsdom issue)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function() {};
}
