/* V31 foot silhouettes, authored in native atlas coordinates.
 * Only rows 37–38 of each 32x40 cell change. No leg rows are duplicated.
 * Keep one transparent row below the soles and retain the 40px frame stride.
 */
function buildV31FeetAtlas(image) {
  const atlas = document.createElement('canvas');
  atlas.width = 128;
  atlas.height = 320;
  const paint = atlas.getContext('2d');
  paint.imageSmoothingEnabled = false;
  paint.drawImage(image, 0, 0);
  const idle = [
    [[11,5],[17,5]], [[11,7]], [[14,7]], [[11,5],[17,5]]
  ];
  // Visible ankle endpoints differ in every walking pose. Raised/hidden feet
  // stay in the original artwork; never attach a stationary pair to the walk.
  const walk = [
    [[[11,6],[17,4]], [[15,6]], [[15,5]], [[14,7]]],
    [[[10,8]], [[8,6],[21,4]], [[10,6]], [[10,6]]],
    [[[14,8]], [[6,6],[17,5]], [[7,6]], [[8,5],[16,6]]],
    [[[11,6]], [[14,6]], [[11,4],[15,5]], [[11,4],[16,5]]]
  ];
  for (let row = 0; row < 8; row++) {
    for (let frame = 0; frame < 4; frame++) {
      const feet = row < 4 ? idle[row] : walk[row - 4][frame];
      const ox = frame * 32, oy = row * 40;
      for (const [x, width] of feet) {
        // A single tapered toe row with a dark sole, joined to the existing
        // ankle above. Side toes point left/right rather than widening both ways.
        paint.fillStyle = '#2a1c18';
        paint.fillRect(ox+x, oy+37, width, 1);
        paint.fillRect(ox+x+1, oy+38, width-2, 1);
        paint.fillStyle = '#cf9a74';
        paint.fillRect(ox+x+1, oy+37, width-2, 1);
        if (width > 4) {
          paint.fillStyle = '#efab83';
          paint.fillRect(ox+x+2, oy+37, width-4, 1);
        }
      }
    }
  }
  return atlas;
}
