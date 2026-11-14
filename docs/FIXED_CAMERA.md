# Fixed gameplay camera

Each world canvas pixel targets two CSS pixels in both orientations. At iPhone DPR 3,
that is six physical pixels per world pixel. Fractional DPRs that would produce a
fractional physical footprint round to the nearest whole device pixel per world pixel.
The viewport clips the canvas edge if its dimensions do not divide evenly by the
scale. The existing camera follow and interior framing use the resulting world
viewport dimensions. Touch hit testing uses the same rounded origin as rendering.

The iPhone reference recording is 1108 × 512. Its character is approximately
44 × 60 recorded pixels, or 11.7% of the frame height, and a nearby large tree is
about 169 recorded pixels high. At an 852 × 393 CSS landscape viewport the existing
21 × 27 Kez atlas cell occupies up to 42 × 54 CSS pixels, or 13.7% of viewport
height. The actual silhouette occupies less than the full cell. This is a starting
scale based on framing and integer pixel magnification. The tree measurement is
a visual comparison point for in-game review.

Run `node --test tests/fixed-camera.test.cjs` for the viewport and DPR checks.
For gameplay verification, serve `public/` on 127.0.0.1:8765, install Playwright
Chromium, and run `node tests/fixed-camera-browser.test.cjs`. Set
`MYRREN_SCREENSHOT_DIR` to an existing directory to capture both orientations
with the mobile controls visible. The browser test uses an iPhone-sized Chromium
viewport and synthetic multitouch. Verify physical iPhone Safari separately.
