// Script to create test images using Node.js
// Run with: node create-test-images.js

const fs = require('fs');
const path = require('path');

// Create a minimal valid JPEG file (< 5MB)
// This is a 1x1 pixel red JPEG
const validJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA//2Q==';

const validJpeg = Buffer.from(validJpegBase64, 'base64');
fs.writeFileSync(path.join(__dirname, 'valid-photo.jpg'), validJpeg);

// Create a large JPEG (> 5MB) by repeating data
const largeBuf = Buffer.alloc(6 * 1024 * 1024); // 6MB
// Copy valid JPEG header
validJpeg.copy(largeBuf, 0);
fs.writeFileSync(path.join(__dirname, 'large-photo.jpg'), largeBuf);

// Create a text file
fs.writeFileSync(path.join(__dirname, 'invalid-file.txt'), 'This is not an image file');

console.log('Test images created successfully!');
