import {Command} from '../structures/Bot';
import {
   BaseGuildTextChannel,
   ChatInputCommandInteraction,
   Colors,
   EmbedBuilder,
   MessageFlags,
   PermissionsBitField,
   SlashCommandBuilder,
} from 'discord.js';

export default {
   enable: true,

   data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('ลบข้อความแบบล้างโลก')
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
      .addIntegerOption(option =>
         option.setName('amount').setDescription('จำนวนข้อความที่ต้องการลบ').setRequired(true).setMinValue(1).setMaxValue(100),
      )
      .addChannelOption(option => option.setName('channel').setDescription('ห้องที่ต้องการลบข้อความ')),

   async execute(interaction: ChatInputCommandInteraction): Promise<void> {
      const {guild, member, options} = interaction;

      const channel = options.getChannel('channel') ?? interaction.channel;

      if (!(channel instanceof BaseGuildTextChannel)) {
         await interaction.reply({
            content: 'กรุณาเลือกห้องข้อความที่ถูกต้อง',
            flags: MessageFlags.Ephemeral,
         });
         return;
      }

      const me = guild!.members.me;

      if (!me || !channel.permissionsFor(me).has(PermissionsBitField.Flags.ManageMessages)) {
         await interaction.reply({
            content: 'ไม่มีสิทธิ์ในการลบข้อความในห้องนี้',
            flags: MessageFlags.Ephemeral,
         });
         return;
      }

      const amount = options.getInteger('amount', true);
      const messages = await channel.bulkDelete(amount, true);

      if (messages.size === 0) {
         await interaction.reply({
            content: 'ไม่พบข้อความที่สามารถลบได้',
            flags: MessageFlags.Ephemeral,
         });
         return;
      }

      const authorCounts = new Map<string, number>();

      for (const message of messages.values()) {
         if (!message?.author) {
            continue;
         }

         const id = message.author.id;
         authorCounts.set(id, (authorCounts.get(id) ?? 0) + 1);
      }

      const description = [...authorCounts.entries()]
         .map(([id, count]) => {
            return `<@${id}>: ${count} ข้อความ`;
         })
         .join('\n');

      await interaction.reply({
         embeds: [
            new EmbedBuilder()
               .setColor(Colors.Green)
               .setTitle('ลบข้อความสำเร็จ')
               .setDescription(description)
               .addFields(
                  {
                     name: 'ลบโดย',
                     value: member?.toString() ?? 'Unknown',
                     inline: true,
                  },
                  {
                     name: 'จำนวนข้อความ',
                     value: messages.size.toString(),
                     inline: true,
                  },
               ),
         ],
      });
   },
} satisfies Command;
