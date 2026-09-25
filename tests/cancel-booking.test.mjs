/**
 * Contract test for POST /bookings/{id}/cancel.
 *
 * Start the mock first (npm run mock:api), then: npm run test:cancel
 * Point it elsewhere with BASE=http://localhost:8000/api/v1 to run it against
 * the real Laravel API.
 */
const BASE = process.env.BASE || 'http://127.0.0.1:8000/api/v1';

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${extra ? ` — ${extra}` : ''}`); }
};

const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

const login = async (email) => {
  const r = await fetch(`${BASE}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' }),
  });
  return (await r.json()).data.token;
};

const book = async (token, checkInOffset, checkOutOffset) => {
  const r = await fetch(`${BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      room_type_id: 4, check_in: d(checkInOffset), check_out: d(checkOutOffset), guests_count: 2,
    }),
  });
  const j = await r.json();
  if (!j.data) throw new Error(`booking failed: ${JSON.stringify(j)}`);
  return j.data;
};

const cancel = async (token, id, body = {}) => {
  const r = await fetch(`${BASE}/bookings/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
};

const guest = await login('guest@example.com');
const owner = await login('owner@example.com');

console.log('\nis_cancellable mirrors Booking::isCancellable()');
const far = await book(guest, 40, 43);
ok(far.is_cancellable === true, 'stay 40 days out is cancellable');

const soon = await book(guest, 1, 3);
ok(soon.is_cancellable === false,
  'stay starting tomorrow is NOT cancellable (inside the 24h window)',
  `got ${soon.is_cancellable}`);

console.log('\nthe list endpoint carries the same flag');
const listRes = await fetch(`${BASE}/bookings`, { headers: { Authorization: `Bearer ${guest}` } });
const list = (await listRes.json()).data;
ok(Array.isArray(list) && list.length > 0, 'GET /bookings returns rows');
ok(list.every((b) => typeof b.is_cancellable === 'boolean'),
  'every row exposes is_cancellable, so the list can render the button');
ok(list.find((b) => b.id === far.id)?.is_cancellable === true,
  'the far booking is cancellable from the list payload');

console.log('\nrefusals');
const tooLate = await cancel(guest, soon.id);
ok(tooLate.status === 422, 'cancelling inside 24h → 422', `got ${tooLate.status}`);
ok(/cannot be cancelled/i.test(tooLate.body?.errors?.booking?.[0] ?? ''),
  'refusal is keyed `booking` with the service message',
  JSON.stringify(tooLate.body));

const notMine = await cancel(owner, far.id);
ok(notMine.status === 403, "another account's booking → 403", `got ${notMine.status}`);

const tooLong = await cancel(guest, far.id, { reason: 'x'.repeat(501) });
ok(tooLong.status === 422, 'reason over 500 chars → 422', `got ${tooLong.status}`);
ok(Boolean(tooLong.body?.errors?.reason), 'error is keyed `reason`');

console.log('\nhappy path');
const done = await cancel(guest, far.id, { reason: 'Plans changed' });
ok(done.status === 200, 'cancel → 200', `got ${done.status}`);
ok(done.body?.data?.status === 'cancelled', 'returns the booking as cancelled');
ok(done.body?.data?.is_cancellable === false, 'returned resource is no longer cancellable');
ok(done.body?.data?.id === far.id, 'returns the same booking id (safe to swap in place)');
ok(typeof done.body?.data?.booking_reference === 'string',
  'returns a full BookingResource, so the list can use it without refetching');

const twice = await cancel(guest, far.id, {});
ok(twice.status === 422, 'cancelling twice → 422', `got ${twice.status}`);

console.log('\npaid booking keeps its payment (cancelBooking has no refund logic)');
const paid = await book(guest, 50, 52);
await fetch(`${BASE}/bookings/${paid.id}/pay`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guest}` },
  body: JSON.stringify({}),
});
const afterPay = await (await fetch(`${BASE}/bookings/${paid.id}`, {
  headers: { Authorization: `Bearer ${guest}` },
})).json();
const paidCancel = await cancel(guest, paid.id, {});
ok(paidCancel.status === 200, 'a paid booking still cancels', `got ${paidCancel.status}`);
ok(paidCancel.body?.data?.payment?.status === afterPay.data?.payment?.status,
  'payment status is untouched by cancelling — no automatic refund');

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
