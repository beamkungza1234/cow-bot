import config from '../config';
import client from '../index';
import {getLastVideoId, getLatestVideo, setLastVideoId} from '../services/youtube';
import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, Colors, Guild} from 'discord.js';
import cron from 'node-cron';

export default {
   once: true,
   enable: true,

   async execute() {
      const guild = await client.guilds.fetch(config.guildId).catch(() => {});

      if (!guild) {
         console.error('Failed to fetch guild.');
         return;
      }

      await Promise.all([guild.members.fetch(), guild.channels.fetch()]);

      await this.setupRegisterChannel(guild);

      let checkingYoutube = false;

      const checkYoutubeAlerts = async () => {
         if (checkingYoutube) {
            console.warn('YouTube check is already running, skipping...');
            return;
         }

         checkingYoutube = true;

         try {
            const results = await Promise.allSettled(
               Object.entries(config.youtubeAlerts).map(([ytChannelId, discordChannelId]) =>
                  this.checkYoutube(ytChannelId, discordChannelId as string),
               ),
            );

            for (const result of results) {
               if (result.status === 'rejected') {
                  console.error('YouTube notifier failed:', result.reason);
               }
            }
         } finally {
            checkingYoutube = false;
         }
      };

      await checkYoutubeAlerts();

      cron.schedule('*/5 * * * *', () => {
         void checkYoutubeAlerts();
      });

      console.log(`Started YouTube notifier (${Object.keys(config.youtubeAlerts).length} channel(s)).`);
   },

   async checkYoutube(ytChannelId: string, discordChannelId: string) {
      try {
         const video = await getLatestVideo(ytChannelId);
         if (!video) {
            return;
         }

         const videoId = video.id?.replace('yt:video:', '');
         if (!videoId) {
            return;
         }

         const lastVideoId = await getLastVideoId(ytChannelId);
         if (!lastVideoId) {
            await setLastVideoId(ytChannelId, videoId);
            return;
         }

         if (lastVideoId === videoId) {
            return;
         }

         const channel = await client.channels.fetch(discordChannelId);

         if (!channel?.isTextBased()) {
            return;
         }

         await (channel as TextChannel).send({
            embeds: [
               new EmbedBuilder()
                  .setColor(Colors.Red)
                  .setAuthor({
                     name: video.author ?? 'A YouTube Channel',
                     url: `https://www.youtube.com/channel/${ytChannelId}`,
                  })
                  .setTitle(video.title ?? 'Untitled Video')
                  .setURL(video.link!)
                  .setImage(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)
                  .setTimestamp(video.pubDate ? new Date(video.pubDate) : new Date()),
            ],
         });

         await setLastVideoId(ytChannelId, videoId);
      } catch (error) {
         console.error('YouTube notifier:', error);
      }
   },

   async setupRegisterChannel(guild: Guild) {
      const channel = guild.channels.cache.get(config.channelIds.register) as TextChannel | undefined;
      if (!channel?.isTextBased()) {
         return;
      }

      const embed = new EmbedBuilder().setTitle('แนะนำตัวเอง').setDescription('กรุณากดปุ่มด้านล่างเพื่อแนะนำตัวเอง').setColor(Colors.Blue);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
         new ButtonBuilder().setCustomId('register').setLabel('แนะนำตัวเอง').setStyle(ButtonStyle.Primary),
      );

      const messages = await channel.messages.fetch({limit: 1}).catch(() => {});
      const message = messages?.first();

      const payload = {embeds: [embed], components: [row]};

      await (message ? message.edit(payload) : channel.send(payload));
   },
};
