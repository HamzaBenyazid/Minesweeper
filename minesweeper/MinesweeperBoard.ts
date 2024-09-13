import {
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
} from "obsidian";
import { BoardSize, GameStatus, Minesweeper } from "./Minesweeper";

export function drawMinesweeperBoard() {
	return (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) => {
		ctx.addChild(new MinesweeperBoard(el, source));
	};
}

export class MinesweeperBoard extends MarkdownRenderChild {
	private boardSize: BoardSize;
	private minesweeper: Minesweeper;
	private CELL_SIZE = 24;
	timeCounter = 0;
	timeCounterInterval: NodeJS.Timer;
	constructor(
		containerEl: HTMLElement,
		source: string
	) {
		super(containerEl);
		this.boardSize = this.readBoardSize(source);
		this.minesweeper = new Minesweeper(this.boardSize);
		containerEl.appendChild(this.drawBoard());
	}

	readBoardSize(source: string): BoardSize{
		const regex = /dif:\s*(\w+)/g;
		const match = regex.exec(source);
		if(match){
			const dif = match[1].toUpperCase();
			return BoardSize[dif as keyof typeof BoardSize];
		}
		return BoardSize.EASY;
	}
	drawBoard() {
		const boardContainer = this.containerEl.createDiv({
			attr: { class: `mnswpr-classic mnswpr-container` },
		});
		this.drawBoardHeader(boardContainer);
		this.drawBoardBody(boardContainer);
		this.drawBoardBottomBorder(boardContainer);
		return boardContainer;
	}

	drawBoardHeader(boardContainer: Element) {
		const boardHeader = boardContainer.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header` },
		});
		// header top border
		const boardHeaderTopBorder = boardHeader.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header header-row top-border`,
			},
		});
		boardHeaderTopBorder.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header top-left` },
		});
		const topBorder = boardHeaderTopBorder.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header mnswpr-hor-border` },
		});
		topBorder.setCssStyles({
			width: `${this.CELL_SIZE * this.minesweeper.cols}px`,
		});
		boardHeaderTopBorder.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header top-right` },
		});
		// left border | dashboard | right border
		const boardHeaderCenter = boardHeader.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header header-row center` },
		});
		boardHeaderCenter.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header left-border` },
		});
		this.drawDashboard(boardHeaderCenter);
		boardHeaderCenter.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header right-border` },
		});
		// header bottom border
		const boardHeaderBottom = boardHeader.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header header-row bottom-border`,
			},
		});
		boardHeaderBottom.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header bottom-border middle-left`,
			},
		});
		const bottomBorder = boardHeaderBottom.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header mnswpr-hor-border` },
		});
		bottomBorder.setCssStyles({
			width: `${this.CELL_SIZE * this.minesweeper.cols}px`,
		});
		boardHeaderBottom.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header bottom-border middle-right`,
			},
		});
	}

	drawBoardBody(boardContainer: Element) {
		const boardBody = boardContainer.createDiv({
			attr: { class: `mnswpr-classic mnswpr-body` },
		});
		// add left border
		boardBody.createDiv({
			attr: { class: `mnswpr-classic mnswpr-body mnswpr-ver-border` },
		});
		// content
		const boardContent = boardBody.createDiv({
			attr: { class: `mnswpr-classic mnswpr-content` },
		});
		for (let rowIndex = 0; rowIndex < this.minesweeper.rows; rowIndex++) {
			const rowDiv = boardContent.createDiv({
				attr: {
					class: `mnswpr-classic mnswpr-row mnswpr-row-${rowIndex}`,
				},
			});
			for (
				let colIndex = 0;
				colIndex < this.minesweeper.cols;
				colIndex++
			) {
				const cellNumber = this.toCellNumber(rowIndex, colIndex);
				const cellDiv = rowDiv.createDiv({
					attr: {
						class: `mnswpr-classic mnswpr-cell mnswpr-cell-${cellNumber} cell-covered`,
						"cell-number": cellNumber,
					},
				});
				cellDiv.setCssStyles({
					width: `${this.CELL_SIZE}px`,
					height: `${this.CELL_SIZE}px`,
				});
				cellDiv.addEventListener("click", (e) => {
					this.makeMove(rowIndex, colIndex, cellDiv);
				});
				cellDiv.addEventListener("contextmenu", (e) => {
					e.preventDefault(); // Prevent the default right-click behavior
					this.toggleFlagCell(rowIndex, colIndex);
				});
			}
		}
		boardBody.createDiv({
			attr: { class: `mnswpr-classic mnswpr-body mnswpr-ver-border` },
		});
		// add right border
	}

	drawBoardBottomBorder(boardContainer: Element) {
		const boardBottomBorder = boardContainer.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header header-row top-border`,
			},
		});
		boardBottomBorder.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header bottom-border bottom-left`,
			},
		});
		const bottomBorder = boardBottomBorder.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header mnswpr-hor-border bottom-border bottom-bottom`,
			},
		});
		bottomBorder.setCssStyles({
			width: `${this.CELL_SIZE * this.minesweeper.cols}px`,
		});
		boardBottomBorder.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header bottom-border bottom-right`,
			},
		});
	}

	drawDashboard(boardHeaderCenter: Element) {
		const dashboard = boardHeaderCenter.createDiv({
			attr: { class: `mnswpr-classic mnswpr-header mnswpr-dashboard` },
		});
		dashboard.setCssStyles({
			width: `${this.CELL_SIZE * this.minesweeper.cols}px`,
		});
		this.drawMineCounterDisplay(dashboard);
		const gameStatusDiv = dashboard.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header mnswpr-dashboard game-status neutral-unpressed`,
			},
		});
		gameStatusDiv.addEventListener("click", () => {
			this.restart();
		});
		this.drawTimeCounter(dashboard);
		this.refreshTimeCounterDisplay();
	}

	drawMineCounterDisplay(dashboard: Element) {
		const mineCounter = dashboard.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header mnswpr-dashboard mine-counter`,
			},
		});
		const digNumberDiv = this.renderDigitalNumber(
			this.minesweeper.numMines
		);
		mineCounter.appendChild(digNumberDiv);
	}

	drawTimeCounter(dashboard: Element) {
		dashboard.createDiv({
			attr: {
				class: `mnswpr-classic mnswpr-header mnswpr-dashboard time-counter`,
			},
		});
	}

	restart() {
		this.stopTimeCounter();
		Array.from(
			{ length: this.minesweeper.rows * this.minesweeper.cols },
			(_, i) => {
				this.refreshGameCell(i);
			}
		);
		this.refreshGameStatus();
		this.timeCounter = 0;
		this.minesweeper = new Minesweeper(this.boardSize);
		this.refreshTimeCounterDisplay();
		this.refreshMineCounterDisplay();
	}

	refreshGameCell(cellNumber: number) {
		const gameCell = this.containerEl.querySelector(
			`.mnswpr-cell-${cellNumber}`
		);
		if (gameCell) {
			gameCell.classList.value = `mnswpr-classic mnswpr-cell mnswpr-cell-${cellNumber} cell-covered`;
			gameCell.setAttr("cell-number", cellNumber);
		}
	}

	refreshGameStatus() {
		const gameStatusDiv = this.containerEl.querySelector(
			".mnswpr-classic.mnswpr-header.mnswpr-dashboard.game-status"
		);
		if (gameStatusDiv) {
			gameStatusDiv.classList.value =
				"mnswpr-classic mnswpr-header mnswpr-dashboard game-status neutral-unpressed";
		}
	}

	refreshTimeCounterDisplay() {
		const timeCounterDiv = this.containerEl.querySelector(".time-counter");
		if (timeCounterDiv) {
			const digNumberDiv = this.renderDigitalNumber(this.timeCounter);
			timeCounterDiv.textContent = ""; // Clear the div
			timeCounterDiv.appendChild(digNumberDiv);
		}
	}

	refreshMineCounterDisplay() {
		const mineCounterDiv = this.containerEl.querySelector(".mine-counter");
		if (mineCounterDiv) {
			const digNumberDiv = this.renderDigitalNumber(
				this.minesweeper.numMines - this.minesweeper.flagCount
			);
			mineCounterDiv.textContent = ""; // Clear the div
			mineCounterDiv.appendChild(digNumberDiv);
		}
	}

	startTimeCounter() {
		this.refreshTimeCounterDisplay();
		this.timeCounter++;
		this.timeCounterInterval = setInterval(async () => {
			await this.refreshTimeCounterDisplay();
			this.timeCounter++;
		}, 1000);
	}

	stopTimeCounter() {
		clearInterval(this.timeCounterInterval);
		this.timeCounter = 0;
	}

	makeMove(cellRow: number, cellCol: number, cellDiv: HTMLDivElement) {
		if (this.minesweeper.status === GameStatus.NOT_STARTED) {
			this.minesweeper.startGame(cellRow, cellCol);
		}
		if(this.minesweeper.status === GameStatus.LOST){
			return;
		}
		if(this.minesweeper.isFlagged(cellRow, cellCol)){
			return;
		}
		if (this.timeCounter === 0) {
			this.startTimeCounter();
		}
		const gameStatusDiv = this.containerEl.querySelector(
			".mnswpr-classic.mnswpr-header.mnswpr-dashboard.game-status"
		);
		if (this.minesweeper.isMine(cellRow, cellCol)) {
			this.minesweeper.uncoverCellValue(cellRow, cellCol, () => {
				cellDiv.addClass("cell-type-mine-red");
			});
			this.minesweeper.uncoverAllOtherMines(
				cellRow,
				cellCol,
				(row, col) => {
					const cellEl = this.getCellDiv(row, col);
					if(this.minesweeper.isFlagged(row, col)){
						return
					}
					cellEl.addClass("cell-type-mine");

				}, (row, col)=>{
					const cellEl = this.getCellDiv(row, col);
					if(this.minesweeper.isFlagged(row, col)){
						cellEl.removeClass("cell-type-flaged");
						cellEl.addClass("cell-type-flaged-red");
					}
				}
			);
			this.minesweeper.status = GameStatus.LOST;
			this.stopTimeCounter();
			if (gameStatusDiv) {
				gameStatusDiv.removeClass("neutral-unpressed");
				gameStatusDiv.addClass("game-lost");
			}
		} else {
			this.minesweeper.uncoverCellValue(cellRow, cellCol, (row, col) => {
				const cellEl = this.getCellDiv(row, col);
				const cellNumber = this.toCellNumber(row, col)

				cellEl.classList.value = `mnswpr-classic mnswpr-cell mnswpr-cell-${cellNumber} cell-type-${this.minesweeper.getValue(row, col)}`
			});
			if(this.minesweeper.status === GameStatus.WON){
				if (gameStatusDiv) {
					gameStatusDiv.removeClass("neutral-unpressed");
					gameStatusDiv.addClass("game-won");
					this.stopTimeCounter();
				}
			}
		}
		this.refreshMineCounterDisplay();
	}

	toggleFlagCell(row: number, col: number) {
		if(this.minesweeper.status === GameStatus.LOST){
			return;
		}
		this.minesweeper.flagCell(row, col, (row, col) => {
			const cellEl = this.getCellDiv(row, col);
			cellEl.classList.toggle("cell-type-flaged")
		});
		this.refreshMineCounterDisplay();
	}

	toCellNumber(row: number, col: number) {
		return row * this.minesweeper.cols + col;
	}

	toCellRowCol(idx: number) {
		const row = Math.floor(idx / this.minesweeper.rows);
		const col = idx % this.minesweeper.cols;
		return [row, col];
	}

	getCellDiv(row: number, col: number): Element {
		const cellEl = this.containerEl.querySelector(
			`.mnswpr-cell[cell-number="${this.toCellNumber(row, col)}"]`
		);
		if (cellEl) {
			return cellEl;
		} else {
			throw new Error("Cell not found");
		}
	}

	renderDigitalNumber(num: number): HTMLElement {
		const lastDigits = num.toString().padStart(3, "0");
		const digNumberDiv = document.createElement("div");
		digNumberDiv.className = "digital-number";
		const digNumber3 = digNumberDiv.createDiv("digital-number-3");
		digNumber3.addClasses(["dig-single", `dig-${lastDigits[0]}`]);
		const digNumber2 = digNumberDiv.createDiv("digital-number-2");
		digNumber2.addClasses(["dig-single", `dig-${lastDigits[1]}`]);
		const digNumber1 = digNumberDiv.createDiv("digital-number-1");
		digNumber1.addClasses(["dig-single", `dig-${lastDigits[2]}`]);
		return digNumberDiv;
	}
}
