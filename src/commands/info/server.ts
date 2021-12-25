import { MessageEmbed, type ChatInputApplicationCommandData, type CommandInteraction, type Guild } from "discord.js";
import { BOOST_LEVELS, defaultEmbedOptions } from "../../constants/index.js";
import { type Command } from "../../typings/index.js";
import Util from "../../utils/index.js";

const data: ChatInputApplicationCommandData = {
	name: "server",
	description: "Sends information about this server"
};

async function execute(intr: CommandInteraction<"cached">) {
	const applyS = (string: string, size: number) => (size !== 1 ? string + "s" : string);
	const { guild } = intr;

	const getEmojisAndStickers = (guild: Guild) => {
		const total = guild.emojis.cache.size;
		const sticker = guild.stickers.cache.size;
		const standard = guild.emojis.cache.filter((em) => em.animated === false).size;
		const animated = guild.emojis.cache.filter((em) => em.animated === true).size;

		const totalStr = `${total ? `**${total}**` : "No"} ${applyS("emoji", total)}`;
		const stickerStr = `${sticker || "no"} ${applyS("sticker", sticker)}`;
		const standardStr = `${standard || "no"} ${applyS("emoji", standard)}`;
		const animatedStr = `${animated || "no"} animated ${applyS("emoji", animated)}`;

		const str = total
			? `${totalStr} in total\n${standardStr}, ${animatedStr}, and ${stickerStr}`
			: `${totalStr} and ${stickerStr}`;

		return str;
	};

	const _channels = guild.channels.cache;
	const voiceChannels = _channels.filter((ch) => ch.isVoice()).size;
	const textChannels = _channels.filter((ch) => ch.isText() && !ch.isThread()).size;
	const channels = _channels.size;

	const { partnered, verified, name } = guild;
	const boosters = guild.premiumSubscriptionCount;
	const created = Util.date(guild.createdAt);
	const vanity = guild.vanityURLCode;
	const roles = Util.parseRoles(guild);
	const icon = guild.iconURL({ size: 2048, dynamic: true }) ?? "";
	const tier = BOOST_LEVELS[guild.premiumTier];

	const vanityStr = vanity ? `with vanity \`${vanity}\`` : "";

	const totalChs = `**${channels}** ${applyS("channel", channels)}`;
	const textChs = `${textChannels} text ${applyS("channel", textChannels)}`;
	const voiceChs = `${voiceChannels} voice ${applyS("channel", voiceChannels)}`;
	const channelsStr = `${totalChs} in total\n${textChs} and ${voiceChs}`;

	const emojisAndStickerStr = getEmojisAndStickers(guild);

	const guildEmbed = new MessageEmbed(defaultEmbedOptions(intr)).setThumbnail(icon).setTitle(name);

	if (partnered && !verified) guildEmbed.setDescription(`A Discord partner ${vanityStr}`);
	if (verified) guildEmbed.setDescription(`A verified server ${vanityStr}`);
	guildEmbed.addField("Roles", roles);

	guildEmbed
		.addField("Created", created)
		.addField("Members", `**${guild.memberCount}** ${applyS("member", guild.memberCount)}`)
		.addField("Channels", channelsStr)
		.addField("Emojis", emojisAndStickerStr)
		.addField(
			"Boosting",
			boosters ? `Server has ${tier} with **${boosters}** ${applyS("boost", boosters)}` : "No boosts"
		);

	intr.editReply({ embeds: [guildEmbed] });

	intr.logger.log(`Sent info of ${guild.name} (${guild.id})`);
}

export const getCommand = () => ({ data, execute } as Partial<Command>);
