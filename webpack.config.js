const path = require("path");
const webpack = require("webpack");
//HtmlWebpackPlugin:Webpackで作られるファイルを、<body/>の最後で読み込むHTMLを作るプラグイン。
//__dirnameはプロジェクトまでの絶対パス(node.js？)

module.exports = {
  mode:"development",//常に開発モード。
  //target: 'node',
  entry:"./src/index.js",//エントリーポイント。一番最初に読み込まれるファイル。相対パスで指定。
  output:{
    path:path.resolve(__dirname, 'public'),//バンドルファイルの出力先。絶対パスで指定。resolve()は絶対パスに変換してくれる。
    filename:"bundle.js"//バンドル後のファイル名
  },
  devServer: {
    contentBase:"public",
    open: true
  },
  /*
    webpackでバンドルする前の下処理の設定。moduleオプション内に、何をどう処理するのかをrulesとして作成する。下処理をするプラグインがいわゆる「XXXX-loader」
    babelの設定はwebpackに書けばこちらが優先される。（babel.config.jsは不要）
  test:対象ファイル
  exclude:除外するディレクトリ
  loader:利用するローダー
  */
  module:{
    rules:[
      
      {
        test:/\.js$/,
        exclude:/node_modules/,
        use:[
          {
            loader:"babel-loader",
            //babelの詳細設定
            options:{
              presets:[["@babel/preset-env"]]
            }
          }
        ]
      },
      
      {
        test:/\.css$/,
        use:[
            "style-loader",
            {
              loader: "css-loader",  //loader: loaderを指定
              options:{
              url: true
              }
            }
          ]
      },
      
      {
            test: /\.(glsl|frag|vert)$/,
            use:[
              {
            loader: 'webpack-glsl-loader'
          }
          ]
        },
      
      {
        test:/\.(jpeg|jpg|png|gif)$/,
        use:[
          {
            //2kバイト以上はfile-loaderでの処理に切り替える。それ以下はurl-loaderで処理
            //file-loader:パブリックURLを返す。
            //url-loader:ファイルをバイナリで読み込む。
            loader:"url-loader",
            options:{
              limit:2048,
              name:"[name].[ext]"//出力するファイル名を指定する。[name]には元となるファイル名、[ext]には元となるファイルの拡張子が入ります。
              }
          }
        ]
      },
      
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      }
      
      
    ]
  },
  plugins:[
    new webpack.ProvidePlugin({
      $:"jQuery",
      jQuery:"jquery"
    })

  ]
};