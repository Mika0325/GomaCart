/* =============================
   Firebase設定
============================= */
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAe8J9sC1aw658fQZidd3KlFlal3Tr7OpU",
    authDomain: "gomacart-98343.firebaseapp.com",
    projectId: "gomacart-98343",
    storageBucket: "gomacart-98343.firebasestorage.app",
    messagingSenderId: "75384858242",
    appId: "1:75384858242:web:8d9c0100fb7a3275beb69b",
    measurementId: "G-WTJZPCRX2F"
};

// Firebase初期化
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

/* =============================
   データ定義
============================= */
let shoppingItems = [];
let stockItems = [];
let storeItems = [];

let currentUserId = null;

// HTML要素
const shoppingList = document.getElementById('shoppingList');
const stockList = document.getElementById('stockList');
const storeList = document.getElementById('storeList');

const itemName = document.getElementById('itemName');
const itemQty = document.getElementById('itemQty');
const itemMemo = document.getElementById('itemMemo');

const stockName = document.getElementById('stockName');
const stockQty = document.getElementById('stockQty');
const stockMemo = document.getElementById('stockMemo');

const storeName = document.getElementById('storeName');
const storeItem = document.getElementById('storeItem');
const storePrice = document.getElementById('storePrice');
const storeMemo = document.getElementById('storeMemo');

const addItemBtn = document.getElementById('addItemBtn');
const addStockBtn = document.getElementById('addStockBtn');
const addStoreBtn = document.getElementById('addStoreBtn');

/* =============================
   Firestoreの保存先
============================= */
function getDataDocument() {
    return doc(
        db,
        'users',
        currentUserId,
        'appData',
        'main'
    );
}

/* =============================
   データ初期値
============================= */
function buildEmptyData() {
    return {
        shoppingItems: [],
        stockItems: [],
        storeItems: [],
        updatedAt: new Date().toISOString()
    };
}

/* =============================
   データ形式の整理
============================= */
function normalizeData(data) {
    const base = buildEmptyData();

    if (!data || typeof data !== 'object') {
        return base;
    }

    return {
        shoppingItems: Array.isArray(data.shoppingItems)
            ? data.shoppingItems
            : [],

        stockItems: Array.isArray(data.stockItems)
            ? data.stockItems
            : [],

        storeItems: Array.isArray(data.storeItems)
            ? data.storeItems
            : [],

        updatedAt: typeof data.updatedAt === 'string'
            ? data.updatedAt
            : base.updatedAt
    };
}

/* =============================
   データ反映
============================= */
function applyData(data) {
    const normalized = normalizeData(data);

    shoppingItems = normalized.shoppingItems;
    stockItems = normalized.stockItems;
    storeItems = normalized.storeItems;
}

/* =============================
   Firebaseからデータを読み込む
============================= */
async function loadData() {
    try {
        const dataRef = getDataDocument();

        const snapshot = await getDoc(dataRef);

        if (snapshot.exists()) {
            const data = normalizeData(snapshot.data());
            applyData(data);
        } else {
            // 初回利用時は空のデータを作成
            const emptyData = buildEmptyData();

            await setDoc(dataRef, emptyData);

            applyData(emptyData);
        }

        renderAllLists();

        console.log('Firebaseからデータを読み込みました。');

    } catch (error) {
        console.error('データの読み込みに失敗しました。', error);

        alert(
            'データを読み込めませんでした。\n' +
            'インターネット接続とFirebaseの設定を確認してください。'
        );
    }
}

/* =============================
   Firebaseにデータを保存する
============================= */
async function saveData() {
    if (!currentUserId) {
        alert('Firebaseに接続できていません。');
        return;
    }

    const data = {
        shoppingItems: shoppingItems,
        stockItems: stockItems,
        storeItems: storeItems,
        updatedAt: new Date().toISOString()
    };

    try {
        const dataRef = getDataDocument();

        await setDoc(dataRef, data);

        console.log('Firebaseにデータを保存しました。');

    } catch (error) {
        console.error('データの保存に失敗しました。', error);

        alert(
            'データを保存できませんでした。\n' +
            'インターネット接続を確認してください。'
        );
    }

    renderAllLists();
}

/* =============================
   入力バリデーション
============================= */
function validateInput(value) {
    if (!value || !value.trim()) {
        alert('必須項目です');
        return false;
    }

    return true;
}

/* =============================
   HTML表示用の文字変換
============================= */
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[char];
    });
}

/* =============================
   リスト描画（共通）
============================= */
function renderList(listElem, items, renderFn) {
    listElem.innerHTML = '';

    items.forEach((item, index) => {
        const li = document.createElement('li');

        li.innerHTML = renderFn(item, index);

        listElem.appendChild(li);
    });
}

/* =============================
   買い物リスト描画
============================= */
function renderShoppingList() {
    renderList(shoppingList, shoppingItems, (item, index) => `
        ${escapeHTML(item.name)}
        ${item.qty ? '(' + escapeHTML(item.qty) + ')' : ''}
        ${item.memo ? ' - ' + escapeHTML(item.memo) : ''}

        <button class="delete-btn"
            data-type="shopping"
            data-index="${index}">
            削除
        </button>

        <button class="move-btn"
            data-index="${index}">
            在庫へ
        </button>
    `);
}

/* =============================
   在庫リスト描画
============================= */
function renderStockList() {
    renderList(stockList, stockItems, (item, index) => `
        ${escapeHTML(item.name)}
        ${item.qty ? '(' + escapeHTML(item.qty) + ')' : ''}
        ${item.memo ? ' - ' + escapeHTML(item.memo) : ''}

        <button class="edit-btn"
            data-type="stock"
            data-index="${index}">
            編集
        </button>

        <button class="delete-btn"
            data-type="stock"
            data-index="${index}">
            削除
        </button>
    `);
}

/* =============================
   店舗リスト描画
============================= */
function renderStoreList() {
    renderList(storeList, storeItems, (item, index) => `
        ${escapeHTML(item.storeName)}
        -
        ${escapeHTML(item.itemName)}

        ${item.price
            ? '(' + escapeHTML(item.price) + '円)'
            : ''}

        ${item.memo
            ? ' - ' + escapeHTML(item.memo)
            : ''}

        <button class="edit-btn"
            data-type="store"
            data-index="${index}">
            編集
        </button>

        <button class="delete-btn"
            data-type="store"
            data-index="${index}">
            削除
        </button>
    `);
}

/* =============================
   すべてのリストを再描画
============================= */
function renderAllLists() {
    renderShoppingList();
    renderStockList();
    renderStoreList();
}

/* =============================
   買い物リスト追加
============================= */
addItemBtn.addEventListener('click', async () => {
    if (!validateInput(itemName.value)) return;

    shoppingItems.push({
        name: itemName.value.trim(),
        qty: itemQty.value.trim(),
        memo: itemMemo.value.trim()
    });

    itemName.value = '';
    itemQty.value = '';
    itemMemo.value = '';

    renderAllLists();

    await saveData();
});

/* =============================
   在庫追加
============================= */
addStockBtn.addEventListener('click', async () => {
    if (!validateInput(stockName.value)) return;

    stockItems.push({
        name: stockName.value.trim(),
        qty: stockQty.value.trim(),
        memo: stockMemo.value.trim()
    });

    stockName.value = '';
    stockQty.value = '';
    stockMemo.value = '';

    renderAllLists();

    await saveData();
});

/* =============================
   店舗メモ追加
============================= */
addStoreBtn.addEventListener('click', async () => {
    if (!validateInput(storeName.value)) return;

    if (!validateInput(storeItem.value)) return;

    storeItems.push({
        storeName: storeName.value.trim(),
        itemName: storeItem.value.trim(),
        price: storePrice.value.trim(),
        memo: storeMemo.value.trim()
    });

    storeName.value = '';
    storeItem.value = '';
    storePrice.value = '';
    storeMemo.value = '';

    renderAllLists();

    await saveData();
});

/* =============================
   削除・移動・編集
============================= */
document.addEventListener('click', async e => {
    const target = e.target;

    if (!(target instanceof Element)) return;

    const index = Number(target.dataset.index);

    // 削除
    if (target.classList.contains('delete-btn')) {
        const type = target.dataset.type;

        if (!Number.isInteger(index) || index < 0) return;

        if (type === 'shopping') {
            shoppingItems.splice(index, 1);
        } else if (type === 'stock') {
            stockItems.splice(index, 1);
        } else if (type === 'store') {
            storeItems.splice(index, 1);
        } else {
            return;
        }

        renderAllLists();

        await saveData();

        return;
    }

    // 買い物リストから在庫へ移動
    if (target.classList.contains('move-btn')) {
        if (!Number.isInteger(index) || index < 0) return;

        const item = shoppingItems.splice(index, 1)[0];

        if (!item) return;

        stockItems.push(item);

        renderAllLists();

        await saveData();

        return;
    }

    // 編集
    if (target.classList.contains('edit-btn')) {
        const type = target.dataset.type;

        if (!Number.isInteger(index) || index < 0) return;

        // 在庫編集
        if (type === 'stock') {
            const item = stockItems[index];

            if (!item) return;

            const name = prompt('名前', item.name);
            if (name === null) return;

            const qty = prompt('数量', item.qty);
            if (qty === null) return;

            const memo = prompt('メモ', item.memo);
            if (memo === null) return;

            stockItems[index] = {
                name: name.trim(),
                qty: qty.trim(),
                memo: memo.trim()
            };
        }

        // 店舗メモ編集
        else if (type === 'store') {
            const item = storeItems[index];

            if (!item) return;

            const storeName = prompt('店舗名', item.storeName);
            if (storeName === null) return;

            const itemName = prompt('商品名', item.itemName);
            if (itemName === null) return;

            const price = prompt('値段', item.price);
            if (price === null) return;

            const memo = prompt('メモ', item.memo);
            if (memo === null) return;

            storeItems[index] = {
                storeName: storeName.trim(),
                itemName: itemName.trim(),
                price: price.trim(),
                memo: memo.trim()
            };
        } else {
            return;
        }

        renderAllLists();

        await saveData();
    }
});

/* =============================
   タブ切替
============================= */
function showTab(id, btn) {
    document.querySelectorAll('.tab-content')
        .forEach(t => t.classList.remove('active'));

    document.getElementById(id).classList.add('active');

    document.querySelectorAll('nav button')
        .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');
}

// HTMLのonclickから呼び出せるようにする
window.showTab = showTab;

/* =============================
   初期化
============================= */
async function initializeGomaCart() {
    try {
        // 匿名認証
        const userCredential = await signInAnonymously(auth);

        // 利用者IDを取得
        currentUserId = userCredential.user.uid;

        console.log('匿名ログインに成功しました。');
        console.log('利用者ID:', currentUserId);

        // Firestoreからデータを読み込む
        await loadData();

    } catch (error) {
        console.error('初期化に失敗しました。', error);

        alert(
            'GomaCartの初期化に失敗しました。\n' +
            'Firebase Authenticationの設定を確認してください。'
        );
    }
}

// アプリ起動
initializeGomaCart();
