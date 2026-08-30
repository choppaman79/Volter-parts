// firebase-sync.js
// Volter 40 部品管理 — Firestoreによるリアルタイム共有
// app.js（クラシックスクリプト）が window.__cloud を用意した後に、
// このモジュールが読み込まれる前提（index.html側の読み込み順で担保）。

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  setPersistence, browserLocalPersistence, inMemoryPersistence,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbW5dti2c6AADhZKj8jPc3kDey1XETqVQ",
  authDomain: "volter40-tenken.firebaseapp.com",
  projectId: "volter40-tenken",
  storageBucket: "volter40-tenken.firebasestorage.app",
  messagingSenderId: "867974508894",
  appId: "1:867974508894:web:d882c33a437e8e6f4e1fcf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const STATE_DOC = doc(db, "shared", "state");

let applyingRemote = false; // Firestoreから受信して反映中は、その内容を書き戻さないためのガード
let ready = false;
window.__cloud = window.__cloud || {};
window.__cloud.isReady = () => ready;

function badge(text, cls){
  let el = document.getElementById("cloudBadge");
  if(!el){
    el = document.createElement("div");
    el.id = "cloudBadge";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.className = "cloudbadge " + cls;
}

badge("同期準備中…", "warn");

// iPhoneの「ホーム画面に追加」で開いた場合（スタンドアロン表示）は、
// 既定のIndexedDB永続化がフリーズすることがあるため、より安定した
// localStorageベースの永続化に明示的に切り替える。それも失敗する場合は
// メモリ内保持（タブを閉じるとログアウトするが、動作はする）にフォールバック。
async function initAuth(){
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch(e) {
    console.warn("browserLocalPersistence設定失敗、inMemoryへフォールバック:", e);
    try { await setPersistence(auth, inMemoryPersistence); } catch(e2){ console.warn(e2); }
  }
  signInAnonymously(auth).catch((err) => {
    console.error("Firebase 認証エラー:", err);
    badge("クラウド同期オフ（この端末のみ）", "warn");
  });
}
initAuth();

// 一定時間たっても準備が整わない場合は、原因が分かるメッセージに切り替える
// （ホーム画面アプリ特有の問題が残っている場合の手がかりにする）
setTimeout(() => {
  if(!ready){
    badge("同期に接続できません（Safariで直接開いてお試しください）", "warn");
  }
}, 9000);

onAuthStateChanged(auth, (user) => {
  if(user) startSync();
});

function startSync(){
  onSnapshot(
    STATE_DOC,
    (snap) => {
      if(!snap.exists()){
        // 初回：まだクラウドにデータが無い場合、この端末のローカルデータで作成する
        const local = window.__cloud.getState();
        setDoc(STATE_DOC, local).catch((e) => console.error("初期化エラー:", e));
        ready = true;
        badge("クラウド同期中", "ok");
        return;
      }
      applyingRemote = true;
      window.__cloud.applyRemoteState(snap.data());
      applyingRemote = false;
      ready = true;
      badge("クラウド同期中", "ok");
    },
    (err) => {
      console.error("同期エラー:", err);
      badge("同期エラー（この端末のみで動作中）", "warn");
    }
  );

  window.__cloudPush = (state) => {
    if(applyingRemote || !ready) return;
    setDoc(STATE_DOC, state).catch((e) => console.error("送信エラー:", e));
  };
}
