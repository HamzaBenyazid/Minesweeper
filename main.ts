import {App, MarkdownView, Plugin, SuggestModal } from 'obsidian';
import { drawMinesweeperBoard } from "minesweeper/MinesweeperBoard";
import { BoardSize } from 'minesweeper/Minesweeper';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor(
			"mnswpr",
			drawMinesweeperBoard(this.app)
		);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export class BoardSelectionModal extends SuggestModal<BoardSize> {
	onSelect: (boardSize: BoardSize) => any
	view: MarkdownView

	constructor(app: App, view: MarkdownView, onSelect: (boardSize: BoardSize) => any) {
		super(app);
		this.view = view;
		this.onSelect = onSelect;
	}

	getSuggestions(): BoardSize[] {
		return [BoardSize.EASY, BoardSize.MID, BoardSize.HARD]
	}

	renderSuggestion(boardSize: BoardSize, el: HTMLElement) {
		el.createEl("div", { text: BoardSize[boardSize]});
	}

	onChooseSuggestion(boardSize: BoardSize, evt: MouseEvent | KeyboardEvent) {
		this.onSelect(boardSize);
	}
}