import { Plugin } from "obsidian";
import { drawMinesweeperBoard } from "minesweeper/MinesweeperBoard";

export default class MinesweeperPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(
			"mnswpr",
			drawMinesweeperBoard()
		);
	}
}
