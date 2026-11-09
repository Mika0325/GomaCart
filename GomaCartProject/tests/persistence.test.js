const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const dataFile = path.join(rootDir, 'Gomadata.json');
const port = 3123;
const serverUrl = `http://localhost:${port}`;

function resetDataFile() {
  fs.writeFileSync(dataFile, JSON.stringify({
    shoppingItems: [],
    stockItems: [],
    storeItems: []
  }, null, 2), 'utf8');
}

async function waitForServer() {
  const timeoutMs = 10000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${serverUrl}/api/data`);
      if (response.ok) return;
    } catch (error) {
      // サーバー起動待ち
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error('サーバーの起動に失敗しました');
}

(async () => {
  resetDataFile();

  const server = spawn(process.execPath, ['GomaCartServer.js'], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  server.stdout.on('data', chunk => { output += chunk.toString(); });
  server.stderr.on('data', chunk => { output += chunk.toString(); });

  try {
    await waitForServer();

    const before = await fetch(`${serverUrl}/api/data`).then(res => res.json());
    assert.deepStrictEqual(before.shoppingItems, []);
    assert.deepStrictEqual(before.stockItems, []);
    assert.deepStrictEqual(before.storeItems, []);

    const payload = {
      shoppingItems: [{ name: 'りんご', qty: '3', memo: '甘い' }],
      stockItems: [{ name: '牛乳', qty: '2', memo: '朝' }],
      storeItems: [{ storeName: 'A店', itemName: 'パン', price: '180', memo: '安い' }]
    };

    const postResponse = await fetch(`${serverUrl}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(postResponse.status, 200, 'POST /api/data should return 200');

    const after = await fetch(`${serverUrl}/api/data`).then(res => res.json());
    assert.deepStrictEqual(after.shoppingItems, payload.shoppingItems, '買い物データが一致するべき');
    assert.deepStrictEqual(after.stockItems, payload.stockItems, '在庫データが一致するべき');
    assert.deepStrictEqual(after.storeItems, payload.storeItems, '店舗データが一致するべき');

    console.log('Persistence smoke test passed');
  } catch (error) {
    console.error('Test failed:');
    console.error(output);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    server.kill('SIGTERM');
  }
})();
