const fs = require('fs');
const path = require('path');

const assetsToRemove = [
  'android-icon-background.png',
  'android-icon-foreground.png',
  'android-icon-monochrome.png',
  'icon.png',
  'partial-react-logo.png',
  'react-logo.png',
  'react-logo@2x.png',
  'react-logo@3x.png'
];

const rootDir = path.join(__dirname, '..');

assetsToRemove.forEach(file => {
  const fullPath = path.join(rootDir, 'assets', 'images', file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`Removed ${file}`);
  }
});

// Cleanup standard boilerplate components
const componentsToClear = [
  'external-link.tsx',
  'haptic-tab.tsx',
  'hello-wave.tsx',
  'parallax-scroll-view.tsx',
  'themed-text.tsx',
  'themed-view.tsx'
];

componentsToClear.forEach(file => {
  const fullPath = path.join(rootDir, 'components', file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`Removed component: ${file}`);
  }
});
