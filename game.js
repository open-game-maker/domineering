//GAME_V3
//ドミナリング
({  
    //定数
    staticValue: {
        //選択肢の制約のインデックス
        SELECTION_INDEX_SELECT_POSITION: 0
    },
    
    //プレイヤー数
    numberOfPlayer: [2],

    /**
     * ゲームの初期化処理(game#initialize)
     * @param {*} ogm 汎用関数
     * @param {*} random 乱数生成
     * @param {*} rule ルール
     * @param {*} mode ターン数、プレイヤー数等のゲームの状態の中でプログラム上から変更できない値
     * @returns 次のゲームの状態
     */
    initialize: function(ogm, random, rule, mode) {
        //ゲームの状態
        //0: 各プレイヤのライフ, 1: デッキのカード, 2: 手札のカード, 3: 選択されたカード, 4: プレイヤーの属する状態変化
        var state = [];

        var stageSize = 0;

        if (rule != null) {
            if (rule.length > 0 && ogm.isNumber(rule[0])) {
                stageSize = rule[0];
            }
        } 
        else {
            stageSize = 5;
        }
        if (stageSize <= 0) {
            stageSize = 5;
        }

        for (var count1 = 0; count1 < stageSize; count1++) {
            state.push([]);
            for (var count2 = 0; count2 < stageSize; count2++) {
                state[count1].push(0);
            }
        }

        //選択の情報をプレイヤーに送信
        var selections = ogm.newArray(2);
        selections[0].push(ogm.createPlayerSelect(this.staticValue.SELECTION_INDEX_SELECT_POSITION, this.staticValue.SELECTION_INDEX_SELECT_POSITION, null));

        //ゲーム状態をプレイヤーに共有する
        var shares = ogm.newArray(mode.numberOfPlayer);
        for (var playerIndex = 0; playerIndex < mode.numberOfPlayer; playerIndex++) {
            shares[playerIndex].push([]);
        }

        //ゲームの情報をプレイヤーに送信する
        var signal = ogm.newArray(mode.numberOfPlayer);
        for (var index = 0; index < mode.numberOfPlayer; index++) {
            //プレイヤーIDを送る（シグナルIDの-1番目をプレイヤーIDを送る用とする）
            signal[index].push([ogm.PLAYER_ID_SIGNAL_ID, index]);
            //プレイヤー数を送る（シグナルIDの-2番目をプレイヤー数を送る用とする）
            signal[index].push([ogm.PLAYER_NUMBER_SIGNAL_ID, mode.numberOfPlayer]);
        }

        //処理結果を返す
        return ogm.createGameNextResult(
            state,
            selections,
            shares,
            null,
            signal,
            null
        );
    },
    /**
     * ゲームの次状態の生成(game#next)
     * @param {*} ogm initializeと同じ
     * @param {*} random initializeと同じ
     * @param {*} state 前のゲームの状態
     * @param {*} selectList プレイヤーの選択
     * @param {*} mode initializeと同じ
     * @returns 次のゲームの状態
     */
    next: function(ogm, random, state, selectList, mode) {
        //staticValueをfunction内で使用するための変数
        var thisStaticValue = this.staticValue;

        var currentPlayerId = -1;

        //全プレイヤーの選択を処理
        for (var playerIndex = 0; playerIndex < mode.numberOfPlayer; playerIndex++) {
            for (var selectIndex = 0; selectIndex < selectList[playerIndex].length; selectIndex++) {
                var playerSelect = selectList[playerIndex][selectIndex].playersSelection;
                if (selectList[playerIndex][selectIndex].selection.constraintsKey == this.staticValue.SELECTION_INDEX_SELECT_POSITION) {
                    //現在のプレイヤーを書き換える
                    currentPlayerId = playerIndex;
                    state[playerSelect[0]][playerSelect[1]] = mode.turn;
                    if (playerIndex == 0) {
                        state[playerSelect[0] + 1][playerSelect[1]] = mode.turn;
                    }
                    else {
                        state[playerSelect[0]][playerSelect[1] + 1] = mode.turn;
                    }
                }
            }
        }

        //ゲームの勝者を表す変数（nullの場合はゲームは続く）
        var winnerSet = null;
        if (this.selectionConstraintsList[0].serachSelect(ogm, state, this.convertPlayerId(currentPlayerId)).length <= 0) {
            //敗北プレイヤーの配列に要素が追加されている場合、ゲーム終了。勝利プレイヤーに1、敗北プレイヤーに0をセットする
            winnerSet = [0, 0];
            winnerSet[currentPlayerId] = 1;
        }

        //選択の情報をプレイヤーに送信
        var selections = ogm.newArray(2);
        selections[this.convertPlayerId(currentPlayerId)].push(ogm.createPlayerSelect(this.staticValue.SELECTION_INDEX_SELECT_POSITION, this.staticValue.SELECTION_INDEX_SELECT_POSITION, null));

        
        //ゲーム状態をプレイヤーに共有する
        var shares = ogm.newArray(mode.numberOfPlayer);
        for (var playerIndex = 0; playerIndex < mode.numberOfPlayer; playerIndex++) {
            shares[playerIndex].push([]);
        }

        //ゲームの情報をプレイヤーに送信する
        var signal = ogm.newArray(mode.numberOfPlayer);
        for (var index = 0; index < mode.numberOfPlayer; index++) {
            //プレイヤーIDを送る（シグナルIDの-1番目をプレイヤーIDを送る用とする）
            signal[index].push([ogm.PLAYER_ID_SIGNAL_ID, index]);
            //プレイヤー数を送る（シグナルIDの-2番目をプレイヤー数を送る用とする）
            signal[index].push([ogm.PLAYER_NUMBER_SIGNAL_ID, mode.numberOfPlayer]);
        }

        //プレイヤーの選択とゲームの状態から得られた処理結果を返す
        return ogm.createGameNextResult(
            state,
            selections,
            shares,
            null,
            signal,
            winnerSet
        );
    },
    //プレイヤーIDから相手プレイヤーIDに変換する
    convertPlayerId: function(playerId) {
        return playerId == 0 ? 1 : 0;
    },
    /**
     * 選択肢の制約
     */
    selectionConstraintsList: [
        {
            //定数
            staticValue: {
                //選択肢の制約のインデックス
                SELECTION_INDEX_SELECT_POSITION: 0
            },
            /**
             * プレイヤーが選択できるすべての選択肢の生成
             * @param {*} ogm 汎用関数
             * @param {*} shareState プレイヤーに渡されているゲームの状態の情報
             * @param {*} selectionSignal 選択に紐づけられている情報
             */
             createAll: function(
                ogm,
                shareState,
                selectionSignal
            ) {
                var playerId = shareState.getSignal(ogm.PLAYER_ID_SIGNAL_ID)[0][1];
                return this.serachSelect(ogm, shareState.getState([]), playerId);
            },
            serachSelect: function(ogm, board, playerId) {
                var selections = [];
                if (playerId == 0) {
                    for (var index1 = 0; index1 < board.length - 1; index1++) {
                        for (var index2 = 0; index2 < board[index1].length; index2++) {
                            if (board[index1][index2] == 0 && board[index1 + 1][index2] == 0) {
                                selections.push([
                                    ogm.deepCopy([index1, index2]), null
                                ]);
                            }
                        }
                    }
                }
                else {
                    for (var index1 = 0; index1 < board.length; index1++) {
                        for (var index2 = 0; index2 < board[index1].length - 1; index2++) {
                            if (board[index1][index2] == 0 && board[index1][index2 + 1] == 0) {
                                selections.push([
                                    ogm.deepCopy([index1, index2]), null
                                ]);
                            }
                        }
                    }
                }
                return selections;
            }
        }
    ]
})
