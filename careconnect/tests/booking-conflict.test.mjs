import assert from "node:assert/strict";

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

(function testOverlaps() {
  const a1 = new Date("2026-01-20T10:00:00Z");
  const a2 = new Date("2026-01-20T10:20:00Z");

  // non-overlap (ends exactly when other starts)
  assert.equal(overlaps(a1, a2, new Date("2026-01-20T10:20:00Z"), new Date("2026-01-20T10:40:00Z")), false);

  // overlap
  assert.equal(overlaps(a1, a2, new Date("2026-01-20T10:10:00Z"), new Date("2026-01-20T10:30:00Z")), true);

  // contained
  assert.equal(overlaps(a1, new Date("2026-01-20T11:00:00Z"), new Date("2026-01-20T10:20:00Z"), new Date("2026-01-20T10:40:00Z")), true);

  console.log("booking-conflict.test.mjs OK");
})();
