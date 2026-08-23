# Volter-parts クラウド同期（Firestore）設定手順

5ファイル構成になりました（新規: firebase-sync.js）。GitHubリポジトリに
以下をすべてアップロード（既存ファイルは置き換え）してください。
- index.html
- data.js
- app.js
- style.css
- firebase-sync.js（新規追加）

アップロードしただけではまだ動きません。Firebaseコンソール側で、あと2つ設定が必要です。

## 1. 匿名認証を有効にする

1. https://console.firebase.google.com を開き、プロジェクト「volter40-tenken」を選択
2. 左メニュー「構築」→「Authentication」
3. 「Sign-in method」タブ→一覧から「匿名」を選択→有効にする→保存

これにより、ブラウザでアプリを開いた人が自動的に（ログイン画面なしで）匿名アカウントとして
接続され、Firestoreへの読み書きが許可されます。個人を特定するものではありません。

## 2. Firestoreのセキュリティルールを設定する

1. 左メニュー「構築」→「Firestore Database」→上部タブ「ルール」
2. 以下の内容に置き換えて「公開」

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

この設定は「匿名でもよいのでFirebase経由でアクセスした人だけ読み書きできる」というルールです。
URLを知っている人なら誰でも使える状態にはなりますが、Firestoreへの直接アクセス（アプリを介さない
不正なアクセス）は防げます。より厳密な制限（社内の特定の人だけ、など）が必要であれば、その旨お知らせください。

## 動作の仕組み

- 誰かが在庫数や点検記録を保存すると、Firestoreの `shared/state` という1つのドキュメントに
  自動的に書き込まれます。
- 他の人がアプリを開いていると、そのデータがリアルタイムで反映されます（ページの再読み込み不要）。
- 画面下部に薄緑（同期中）または黄色（この端末のみで動作中＝オフライン等）のバッジが表示され、
  同期状態がひと目でわかります。
- 万が一Firebaseに接続できない状況でも、アプリ自体は今まで通りこの端末内で使い続けられます
  （データが消えることはありません）。

## 反映確認

GitHub Pagesへの反映後、実際に2つの端末（またはブラウザのシークレットウィンドウ2つ）で
同じURLを開き、片方で部品の在庫数を保存し、もう片方に反映されるか確認してみてください。
