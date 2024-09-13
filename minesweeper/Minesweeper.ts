export enum BoardSize {
	EASY,
	MID,
	HARD,
}

export enum GameStatus {
	NOT_STARTED,
	ON_GOING,
	LOST,
	WON,
}

export class Minesweeper {
	boardSize: BoardSize;
	private board: number[][];
	rows: number;
	cols: number;
	numMines: number;
    flagCount = 0;
	uncoveredCellsCount = 0;
	private uncoveredCells: boolean[][];
    private flaggedCells: boolean[][];
	status: GameStatus;

	constructor(boardSize: BoardSize) {
		this.boardSize = boardSize;
		this.status = GameStatus.NOT_STARTED;
		this.initializeBoard();
	}

	initializeBoard() {
		switch (this.boardSize) {
			case BoardSize.EASY:
				this.rows = 9;
				this.cols = 9;
				this.numMines = 10;
				break;
			case BoardSize.MID:
				this.rows = 16;
				this.cols = 16;
				this.numMines = 40;
				break;
			case BoardSize.HARD:
				this.rows = 24;
				this.cols = 24;
				this.numMines = 99;
				break;
		}
		this.board = new Array(this.rows)
			.fill(0)
			.map(() => new Array(this.cols).fill(0));
		this.uncoveredCells = new Array(this.rows)
			.fill(false)
			.map(() => new Array(this.cols).fill(false));
        this.flaggedCells = new Array(this.rows)
			.fill(false)
			.map(() => new Array(this.cols).fill(false));
	}

	startGame(startCellRow: number, startCellCol: number){
		this.placeMines(startCellRow, startCellCol);
		this.populateCells();
		this.status = GameStatus.ON_GOING;
	}

	placeMines(startCellRow: number, startCellCol: number) {
		const startCellNumber = startCellRow * this.cols + startCellCol;
		const maxIdx = this.rows * this.cols - 1;
		for (let i = 0; i < this.numMines; i++) {
			let mineIdx = Math.floor(Math.random() * (maxIdx + 1));
			let mineRow = Math.floor(mineIdx / this.rows);
			let mineCol = mineIdx % this.cols;
			while(mineIdx === startCellNumber || this.isMine(mineRow, mineCol)){
				mineIdx = Math.floor(Math.random() * (maxIdx + 1));
				mineRow = Math.floor(mineIdx / this.rows);
				mineCol = mineIdx % this.cols;
			}
			this.board[mineRow][mineCol] = -1;
		}
	}
	populateCells() {
		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				if (this.board[i][j] !== -1) {
					//top
					if (i - 1 > -1 && this.isMine(i - 1, j)) {
						this.board[i][j]++;
					}
					//top-right
					if (
						i - 1 > -1 &&
						j + 1 < this.cols &&
						this.isMine(i - 1, j + 1)
					) {
						this.board[i][j]++;
					}
					//right
					if (j + 1 < this.cols && this.isMine(i, j + 1)) {
						this.board[i][j]++;
					}
					//bottom-right
					if (
						i + 1 < this.rows &&
						j + 1 < this.cols &&
						this.isMine(i + 1, j + 1)
					) {
						this.board[i][j]++;
					}
					//bottom
					if (i + 1 < this.rows && this.isMine(i + 1, j)) {
						this.board[i][j]++;
					}
					//bottom-left
					if (
						j - 1 > -1 &&
						i + 1 < this.rows &&
						this.isMine(i + 1, j - 1)
					) {
						this.board[i][j]++;
					}
					//left
					if (j - 1 > -1 && this.isMine(i, j - 1)) {
						this.board[i][j]++;
					}
					//top-left
					if (i - 1 > -1 && j - 1 > -1 && this.isMine(i - 1, j - 1)) {
						this.board[i][j]++;
					}
				}
			}
		}
	}

	printBoard() {
		let textBoard = "";
		for (const row of this.board) {
			textBoard += row.join("   ") + "\n";
		}
		return textBoard;
	}

	isMine(row: number, col: number) {
        this.validateRowAndCol(row, col)
		return this.board[row][col] === -1;
	}

    isFlagged(row: number, col: number) {
        this.validateRowAndCol(row, col)
		return this.flaggedCells[row][col];
	}

	uncoverCellValue(
		row: number,
		col: number,
		uncoverCallback: (row: number, col: number) => void = () => {}
	) {
		if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
			return;
		}
		if (this.uncoveredCells[row][col]) {
			return;
		}
		// uncover value
		if(this.isFlagged(row, col)){
			this.flaggedCells[row][col] = false;
			this.flagCount--;
		}
		uncoverCallback(row, col);
		this.uncoveredCells[row][col] = true;
		this.uncoveredCellsCount ++;

		// if value 0, uncover neighbors
		if (this.board[row][col] === 0) {
			this.uncoverCellValue(row - 1, col, uncoverCallback);
			this.uncoverCellValue(row - 1, col + 1, uncoverCallback);
			this.uncoverCellValue(row, col + 1, uncoverCallback);
			this.uncoverCellValue(row + 1, col + 1, uncoverCallback);
			this.uncoverCellValue(row + 1, col, uncoverCallback);
			this.uncoverCellValue(row + 1, col - 1, uncoverCallback);
			this.uncoverCellValue(row, col - 1, uncoverCallback);
			this.uncoverCellValue(row - 1, col - 1, uncoverCallback);
		}

		if(this.uncoveredCellsCount + this.numMines === this.rows * this.cols){
			this.status = GameStatus.WON
		}
	}

	flagCell(
		row: number,
		col: number,
		flagCallback: (row: number, col: number) => void = () => {}
	) {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
			return;
		}
		if(!this.isCovered(row, col)){
			return
		}
        if(this.isFlagged(row, col)){
            this.flaggedCells[row][col] = false
            this.flagCount--;
            flagCallback(row, col);
        } else if(this.flagCount < this.numMines){
            this.flaggedCells[row][col] = true
            this.flagCount++;
            flagCallback(row, col);
        }
    }

    uncoverAllOtherMines(mineRow: number, mineCol: number, mineCallback: (row: number, col: number)=>void, notMineCallback: (row: number, col: number)=>void){
        this.board.forEach((rows, rowIdx) => {
            rows.forEach((_, colIdx) => {
                if(rowIdx === mineRow && colIdx === mineCol){
                    return;
                }
                if(this.isMine(rowIdx, colIdx)){
                    mineCallback(rowIdx, colIdx)
                } else {
					notMineCallback(rowIdx, colIdx);
				}
            })
        })
    }

    isCovered(row:number, col:number){
        this.validateRowAndCol(row, col)
        return !this.uncoveredCells[row][col]
    }

    getValue(row: number, col: number){
        this.validateRowAndCol(row, col)
        return this.board[row][col]
    }

    validateRowAndCol(row: number, col: number){
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
			throw Error("Invalid row or column index")
		}
    }
}
