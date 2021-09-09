import type {
	ApplicationCommandData,
	ApplicationCommandOptionData,
	ApplicationCommandSubCommandData,
	ApplicationCommandSubGroupData
} from "discord.js";
import type { CmdIntr, Command } from "../typings.js";

import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { ErrorLogger } from "../utils/logger/ErrorLogger.js";
import { readdirSync } from "fs";
import { InfoLogger } from "../utils/logger/InfoLogger.js";
import { ID_REGEX } from "../constants.js";
import { Routes } from "discord-api-types/v9";
import { REST } from "@discordjs/rest";

const COMMAND_DIR = new URL("../commands", import.meta.url);

const SUBGROUP_TYPE = ApplicationCommandOptionType.SubcommandGroup as number;
const SUB_TYPE = ApplicationCommandOptionType.Subcommand as number;

/**
 * Manages commands for the client.
 */
export class CommandManager {
	private _commands: Map<string, Command>;

	/**
	 * Creates a command manager.
	 */
	constructor() {
		this._commands = new Map();
	}

	/**
	 * Initialises the class by loading commands internally.
	 */
	public async init(): Promise<void> {
		const folders = this._readDir(COMMAND_DIR);
		this._commands = await this._getCommands(folders);
	}

	/**
	 * Tries to execute a given command.
	 */
	public execute(intr: CmdIntr): void {
		this._commands.get(intr.commandName)?.execute(intr);
	}

	/**
	 * Gets the default hide option of this command.
	 */
	public getDefaultHide(intr: CmdIntr | string): boolean {
		if (typeof intr !== "string") {
			const commandOption = intr.options.getBoolean("hide");
			const standard = this._commands.get(intr.commandName)?.defaultHide ?? true;

			return commandOption ?? standard;
		} else {
			return this._commands.get(intr)?.defaultHide ?? true;
		}
	}

	/**
	 * Sets global (client) or guild commands in Discord.
	 */
	public async put(clientId: string, guildId?: string): Promise<boolean> {
		return await this._put(clientId, guildId);
	}

	/**
	 * Clears global (client) or guild commands in Discord.
	 */
	public async clear(clientId: string, guildId?: string): Promise<boolean> {
		return await this._put(clientId, guildId, true);
	}

	/**
	 * Reads and returns a directory for files with a given URL.
	 */
	private _readDir(dir: URL): string[] {
		return readdirSync(dir);
	}

	/**
	 * Returns a map of all commands in given folders mapped by their names.
	 */
	private async _getCommands(folders: string[]): Promise<Map<string, Command>> {
		const hash: Map<string, Command> = new Map();
		for (let folder of folders) {
			const FOLDER_DIR = new URL(`../commands/${folder}`, import.meta.url);

			const files = this._readDir(FOLDER_DIR);
			for (let fileName of files) {
				const command = (await import(`../commands/${folder}/${fileName}`)) as Command;
				const name = fileName.split(".")[0];
				hash.set(name, command);
			}
		}
		return hash;
	}

	/**
	 * Adds a "hide" option to the given option array, if none present.
	 */
	private _addHideOption(options: ApplicationCommandOptionData[], name: string) {
		if (!options.some((option) => option.name === "hide")) {
			const hide = this.getDefaultHide(name);
			const hideOption = {
				name: "hide",
				description: `Hide the output. Default is ${hide}`,
				type: ApplicationCommandOptionType.Boolean as number
			};

			options.push(hideOption);
		}

		return options;
	}

	/**
	 * Returns an array of all the cached commands' data.
	 * Ensures a "hide" option in all chat-input commands.
	 */
	private _getData(): ApplicationCommandData[] {
		return [...this._commands.values()].map((cmd) => {
			if (cmd.data.type && cmd.data.type !== "CHAT_INPUT") return cmd.data;

			cmd.data.options ??= [];

			const isSubcommandGroup = cmd.data.options[0]?.type === SUBGROUP_TYPE;
			const isSubcommand = cmd.data.options[0]?.type === SUB_TYPE;

			// TODO: find out how to properly type this
			if (isSubcommandGroup) {
				const commandData = cmd.data as unknown as ApplicationCommandSubGroupData;
				commandData.options?.forEach((subcommandGroup) => {
					subcommandGroup.options?.forEach((subcommand) => {
						// @ts-expect-error
						subcommand.options = this._addHideOption(subcommand.options ?? [], cmd.data.name);
					});
				});
			} else if (isSubcommand) {
				const commandData = cmd.data as unknown as ApplicationCommandSubCommandData;
				commandData.options?.forEach((subcommand) => {
					// @ts-expect-error
					subcommand.options = this._addHideOption(subcommand.options ?? [], cmd.data.name);
				});
			} else {
				cmd.data.options = this._addHideOption(cmd.data.options, cmd.data.name);
			}

			return cmd.data;
		});
	}

	/**
	 * Sets cached commands in Discord.
	 * Returns true if it succeeded, and false if it failed.
	 */
	private async _put(clientId: string, guildId?: string, clear: boolean = false): Promise<boolean> {
		const errorLogger = new ErrorLogger();
		const infoLogger = new InfoLogger();

		if (!process.env.TOKEN) {
			errorLogger.log("Token not defined in .env file");
			return false;
		}

		if (!ID_REGEX.test(clientId)) {
			errorLogger.log(`Client id is faulty: ${clientId}`);
			return false;
		}

		if (guildId && !ID_REGEX.test(guildId)) {
			errorLogger.log(`Guild id is faulty: ${clientId}`);
			return false;
		}

		const data = this._getData();
		const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

		try {
			const route = guildId
				? Routes.applicationGuildCommands(clientId, guildId)
				: Routes.applicationCommands(clientId);

			const options = { body: clear ? [] : data };

			const res = await rest
				.put(route, options)
				.then(() => `${clear ? "Cleared" : "Set"} commands in guild: ${guildId}`)
				.catch((err) => {
					const error = err as Error; // stupid
					errorLogger.log(error.stack ?? error.message);

					return null;
				});

			if (res) {
				infoLogger.log(res);
				return true;
			} else {
				return false;
			}
		} catch (err) {
			const error = err as Error; // stupid
			errorLogger.log(error.stack ?? error.message);

			return false;
		}
	}
}
