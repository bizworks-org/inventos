/* Simple smoke test for edit endpoints on port 3000 */
const base = 'http://localhost:3000';

async function testEdit(endpoint, nameKey = 'name') {
  const list = await fetch(`${base}/api/${endpoint}`).then(r => r.json());
  if (!Array.isArray(list) || list.length === 0) {
    console.log(`[${endpoint}] No items to test`);
    return;
  }
  const id = list[0].id;
  const item = await fetch(`${base}/api/${endpoint}/${id}`).then(r => r.json());
  const oldName = item[nameKey];
  const updated = { ...item, [nameKey]: `${oldName} (Edited by smoke)` };
  const put = await fetch(`${base}/api/${endpoint}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  if (!put.ok) {
    const err = await put.text();
    throw new Error(`[${endpoint}] PUT failed: ${put.status} ${err}`);
  }
  const after = await fetch(`${base}/api/${endpoint}/${id}`).then(r => r.json());
  console.log(`[${endpoint}] Old Name: ${oldName}`);
  console.log(`[${endpoint}] New Name: ${after[nameKey]}`);
}

(async () => {
  try {
    await testEdit('licenses');
  } catch (e) {
    console.error(e);
  }
  try {
    await testEdit('vendors');
  } catch (e) {
    console.error(e);
  }
})();
