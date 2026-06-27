import {roundedRect} from '../utils/canvasUtil';
import {createCanvas, loadImage, GlobalFonts} from '@napi-rs/canvas';
import {AttachmentBuilder, GuildMember} from 'discord.js';
import path from 'node:path';

GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Itim-Regular.ttf'), 'TH-Custom');

export async function generateCard(member: GuildMember, titleText: string): Promise<AttachmentBuilder> {
   const canvas = createCanvas(700, 250);
   const ctx = canvas.getContext('2d');

   ctx.imageSmoothingEnabled = true;

   // bg
   try {
      const background = await loadImage(path.join(__dirname, '../../assets/images/beach_bg.png'));
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
   } catch (error) {
      console.error('Failed to load background:', error);
      ctx.fillStyle = '#2c2f33';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
   }

   // bg overlay
   ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   // title
   ctx.fillStyle = '#ffffff';
   ctx.font = '28px "TH-Custom"';
   ctx.fillText(titleText, 220, 95);

   // username
   ctx.font = 'bold 36px "TH-Custom"';
   ctx.fillText(member.user.username, 220, 155);

   // ava
   const avatarX = 55;
   const avatarY = 65;
   const avatarSize = 120;
   const radius = 20;

   try {
      const avatar = await loadImage(
         member.user.displayAvatarURL({
            extension: 'png',
            size: 256,
         }),
      );

      ctx.save();
      roundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, radius);
      ctx.clip();

      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);

      ctx.restore();
   } catch (error) {
      console.error('Failed to load avatar:', error);

      ctx.fillStyle = '#555';
      roundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, radius);
      ctx.fill();
   }

   return new AttachmentBuilder(canvas.toBuffer('image/png'), {
      name: 'card-image.png',
   });
}
