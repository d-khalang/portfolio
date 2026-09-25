import test from 'node:test';
import assert from 'node:assert/strict';
import { bikePose, bikeDrive, foregroundOpacity, rideProgress, projectPose, tileOffset } from '../src/components/journeyMotion.ts';

test('bike position and tilt are continuous across landing, bounce and exit boundaries', () => {
  for (const width of [190, 346, 390]) {
    for (const boundary of [.11, .125, .132, .14, .15, .156, .162, .17, .18, .83, .85, .9]) {
      const before = bikePose(boundary - 1e-8, { x: 180, y: -350 }, width);
      const after = bikePose(boundary + 1e-8, { x: 180, y: -350 }, width);
      for (const key of ['x', 'y', 'rotation', 'scale', 'opacity']) {
        assert.ok(Math.abs(before[key] - after[key]) < .01, `${boundary}: ${key}`);
      }
    }
  }
});

test('launch coasts before pedalling and dust, then rejoins the original route', () => {
  assert.deepEqual(bikeDrive(.15), { wheel: 0, pedals: 0, dust: false });
  assert.ok(bikeDrive(.153).wheel > 0);
  assert.equal(bikeDrive(.153).pedals, 0);
  assert.ok(bikeDrive(.16).pedals > 0);
  assert.equal(bikeDrive(.16).dust, false);
  assert.equal(bikeDrive(.17).dust, true);
  assert.equal(bikeDrive(.82).dust, false);
  let previous = { wheel: 0, pedals: 0 };
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000;
    const drive = bikeDrive(progress);
    assert.ok(drive.wheel >= previous.wheel && drive.pedals >= previous.pedals);
    if (progress >= .18) assert.equal(drive.pedals, drive.wheel);
    if (progress >= .17 && progress <= .85) {
      assert.ok(Math.abs(rideProgress(progress) - (progress - .15) / .7) < 1e-12);
    }
    previous = drive;
  }
});

test('foreground plants fade in through the intro and restore on reverse', () => {
  assert.equal(foregroundOpacity(0), 0);
  assert.equal(foregroundOpacity(.15), .7);
  assert.equal(foregroundOpacity(1), .7);

  const forward = [];
  let previous = 0;
  for (let i = 0; i <= 150; i++) {
    const opacity = foregroundOpacity(i / 1000);
    assert.ok(opacity >= previous);
    assert.ok(opacity >= 0 && opacity <= .7);
    forward.push(opacity);
    previous = opacity;
  }

  for (let i = 150; i >= 0; i--) {
    assert.equal(foregroundOpacity(i / 1000), forward[i]);
  }
});

test('returning through the journey restores the same bike pose', () => {
  const origin = { x: 180, y: -350 };
  const forward = Array.from({ length: 1001 }, (_, i) => bikePose(i / 1000, origin, 346));
  for (let i = 1000; i >= 0; i--) assert.deepEqual(bikePose(i / 1000, origin, 346), forward[i]);
  assert.equal(forward[1000].opacity, 0);
  assert.deepEqual(forward[0], { x: 180, y: -350, rotation: -30, scale: .85, opacity: 1 });
});

test('wrapped strips cover the viewport and preserve the original texture phase', () => {
  for (const tileWidth of [512, 1048.125, 1370.1492537313432]) {
    for (let distance = 0; distance <= 10000; distance += 7.31) {
      const x = tileOffset(distance, tileWidth);
      assert.ok(x <= 0 && x > -tileWidth);
      const repeat = (distance + x) / tileWidth;
      assert.ok(Math.abs(repeat - Math.round(repeat)) < 1e-9);
      assert.ok(x + 1440 + tileWidth + 2 >= 1440);
    }
  }
});

test('cards focus at their navigation destination and disappear outside the ride', () => {
  for (const position of [0, .2, .4, .6, .8]) {
    const baseLeft = 65 + 500 * position;
    const progress = .15 + .70 * (position + .03);
    const pose = projectPose(progress, baseLeft, 900);
    assert.ok(Math.abs(pose.left - 50) < 1e-9);
    assert.equal(pose.scale, 1);
    assert.equal(pose.opacity, 1);
    assert.equal(projectPose(0, baseLeft, 900).opacity, 0);
    assert.equal(projectPose(.85, baseLeft, 900).opacity, 0);
  }
});
