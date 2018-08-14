const Augur = require("augurbot"),
  config = require("../config/giphy.json"),
  profanityFilter = require("profanity-matcher"),
  request = require("request"),
  u = require("../utils/utils");

const pf = new profanityFilter();

const Module = new Augur.Module()
.addCommand({name: "giphy",
	description: "Post a gif reaction. Powered by GIPHY.",
	syntax: "<reaction>",
	aliases: ["gif", "react"],
  permissions: (msg) => (msg.guild && msg.channel.permissionsFor(msg.member).has(["EMBED_LINKS", "ATTACH_FILES"]) && msg.channel.permissionsFor(msg.client.user).has("ATTACH_FILES")),
	process: (msg, suffix) => {
		u.clean(msg, 0);
    let bot = msg.client;
		if (pf.scan(suffix.toLowerCase()).length == 0) {
			let url = `https://api.giphy.com/v1/gifs/search?api_key=${config.apiKey}&q=${encodeURI(suffix)}&limit=${config.limit}&offset=0&rating=${config.rating}&lang=${config.lang}`;

			request(url, async function(error, response, body) {
				if (!error && response.statusCode == 200) {
					body = JSON.parse(body);
          if (body.data.length > 0) {
						let file = body.data[Math.floor(Math.random() * body.data.length)].images;
						if (file.downsized) file = file.downsized.url;
						else if (file.downsized_medium) file = file.downsized_medium.url;
						else if (file.downsized_large) file = file.downsized_large.url;
						else file = file.original.url;

						let m = await msg.channel.send(`${msg.member.displayName}: \`${suffix}\``,
							{files: [
								{attachment: file, name: suffix + ".gif"}
							]}
						);
						await m.react("🚫");
            let reactions = await m.awaitReactions(
              (reaction, user) => ((reaction.emoji.name == "🚫") && (user.id != bot.user.id) && (user.id == msg.author.id || m.channel.permissionsFor(user).has("MANAGE_MESSAGES"))),
              {max: 1, time: 60000}
            );

            if (reactions.size > 0) reactions.first().message.delete();
            else m.reactions.get("🚫").remove(bot.user.id);

					} else msg.reply("I couldn't find any gifs for " + suffix).then(u.clean);
				} else msg.reply("I ran into an error:" + JSON.stringify(error)).then(u.clean);
			});
		} else msg.reply("I'm not going to search for that. :rolling_eyes:").then(u.clean);
	}
});

module.exports = Module;