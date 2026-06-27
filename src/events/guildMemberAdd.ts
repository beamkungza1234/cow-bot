import config from '../config';
import {generateCard} from '../canvas/joinCard';
import {EmbedBuilder, GuildMember} from 'discord.js';

export default {
   enable: true,
   once: false,

   async execute(member: GuildMember) {
      const channel = member.guild.channels.cache.get(config.channelIds.welcome);
      if (!channel?.isSendable()) {
         return;
      }

      try {
         const attachment = await generateCard(member, 'ยินดีต้อนรับสู่ Server');

         await channel.send({
            content: `สวัสดีครับคุณ ${member}!`,
            embeds: [
               new EmbedBuilder()
                  .setColor(0x25_96_be)
                  .setTitle(`🐮 ยินดีต้อนรับสู่ ${member.guild.name}`)
                  .setDescription(
                     [
                        `สมาชิกใหม่ -> ${member}`,
                        `จำนวนสมาชิกปัจจุบัน -> ${member.guild.memberCount}`,
                        'แนะนำตนเองได้ที่ - [กดตรงนี้](https://discord.com/channels/997523369337561170/1517582344926662729)',
                     ].join('\n'),
                  )
                  .setThumbnail(member.displayAvatarURL({extension: 'png', size: 256}))
                  .setImage('attachment://card-image.png')
                  .setTimestamp(),
            ],
            files: [attachment],
         });
      } catch (error) {
         console.error('Failed to send welcome message:', error);
      }
   },
};
