# Volter 40 部品管理アプリ

Volter 40の部品・在庫・点検をブラウザで管理する静的HTMLアプリです。

## GitHub Pagesで公開

1. GitHubで新しいRepositoryを作成
2. `index.html` / `style.css` / `app.js` / `data.js` をアップロード
3. Repository → Settings → Pages
4. Sourceを `Deploy from a branch`
5. Branchを `main`、Folderを `/ (root)` にしてSave
6. 数分後に表示されたURLをスマホのChrome等で開く

## 特徴

- 469件の部品マスターを収録
- 定期交換品 / 常備予備品 / 故障・摩耗時のみで分類
- 品名・品番検索
- 在庫数・発注点・最終入庫日・最終交換日・保管場所を入力
- 発注アラート
- CSV出力
- JSONバックアップ/復元
- 120h～78000hの点検スケジュール
- スマホ対応

## 注意

在庫情報はブラウザのLocalStorageに保存されます。
複数のスマホ・PCで同じ在庫を共有するクラウドDB機能はこの静的版にはありません。

分類「常備予備品」「故障・摩耗時のみ」は、在庫管理のための実務上の分類です。Volterが全品について常備を指定していることを意味しません。
