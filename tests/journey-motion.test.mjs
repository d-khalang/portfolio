import test from 'node:test';
import assert from 'node:assert/strict';
import { bikePose, projectPose, tileOffset } from '../src/components/journeyMotion.ts';

test('bike position and tilt are continuous across landing, bounce and exit boundaries', () => {
  for (const width of [190, 346, 390]) {
    for (const boundary of [.11, .135, .15, .17, .83, .85, .9]) {
      const before = bikePose(boundary - 1e-8, { x: 180, y: -350 }, width);
      const after = bikePose(boundary + 1e-8, { x: 180, y: -350 }, width);
      for (const key of ['x', 'y', 'rotation', 'scale', 'opacity']) {
        assert.ok(Math.abs(before[key] - after[key]) < .01, `${boundary}: ${key}`);
      }
    }
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
