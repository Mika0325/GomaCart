const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'Gomadata.json');

function defaultData() {
    return {
        shoppingItems: [],
        stockItems: [],
        storeItems: [],
        updatedAt: new Date().toISOString()
    };
}

function sanitizeData(data) {
    const base = defaultData();
    if (!data || typeof data !== 'object') return base;

    return {
        shoppingItems: Array.isArray(data.shoppingItems) ? data.shoppingItems : base.shoppingItems,
        stockItems: Array.isArray(data.stockItems) ? data.stockItems : base.stockItems,
        storeItems: Array.isArray(data.storeItems) ? data.storeItems : base.storeItems,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : base.updatedAt,
    };
}

/* ---------------- データ操作 ---------------- */
function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        return defaultData();
    }

    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return sanitizeData(JSON.parse(raw));
    } catch (error) {
        console.error('データ読み込みに失敗しました:', error.message);
        return defaultData();
    }
}

function saveData(data) {
    const safeData = sanitizeData(data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(safeData, null, 2), 'utf8');
    return safeData;
}

/* ---------------- 静的ファイル ---------------- */
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Goma.html'));
});

/* ---------------- API ---------------- */
app.get('/api/data', (req, res) => {
    res.json(loadData());
});

app.post('/api/data', (req, res) => {
    const saved = saveData(req.body);
    res.json({ status: 'ok', data: saved });
});

/* ---------------- 起動 ---------------- */
app.listen(PORT, () => {
    console.log(`Gomacart server running → http://localhost:${PORT}`);
});
