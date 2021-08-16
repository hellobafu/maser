import { Client } from "discord.js";
import { INTENTS } from "../Constants.js";
import { CommandManager } from "./CommandManager.js";
import { EventManager } from "./EventManager.js";

export class Clint extends Client {
	commands: CommandManager;
	events: EventManager;

	constructor() {
		super({
			intents: INTENTS,
			allowedMentions: { repliedUser: false }
		});

		this.commands = new CommandManager();
		this.events = new EventManager(this);
	}

	// util
}
