import { RateLimitData } from "discord.js";
import { Clint } from "../extensions/Clint";

export async function execute(client: Clint, object: RateLimitData) {
	const { global, limit, method, path, route, timeout } = object;

	client.events.logger
		.setEvent("rate limit")
		.log(
			`Global: ${global}`,
			`Limit: ${limit}`,
			`Method: ${method}`,
			`Path: ${path}`,
			`Route ${route}`,
			`Timeout: ${timeout}`
		);
}