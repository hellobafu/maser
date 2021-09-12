import type { ApplicationCommandData, CommandInteraction, Guild, GuildMember } from "discord.js";
import type { CommandLogger } from "./utils/logger/CommandLogger.js";
import type { Clint } from "./extensions/Clint";

// TODO: module augment

export type ClientColors = Map<string, `#${string}`>;
export type ConfigColumns = "id" | "bot_log_channel_id" | "member_log_channel_id";

export interface Command {
	data: ApplicationCommandData;
	defaultHide: boolean;
	execute(interaction: CmdIntr): Promise<void> | void;
}

export interface Event {
	execute(client: Clint, ...args: unknown[]): Promise<void> | void;
}

export interface CmdIntr extends CommandInteraction {
	logger: CommandLogger;
	client: Clint;

	member: GuildMember;
	guild: Guild;
}

export interface ConfigResult {
	id?: string;
	bot_log_channel_id?: string | null;
	member_log_channel_id?: string | null;
}

export interface ExistsResult {
	exists: boolean;
}
