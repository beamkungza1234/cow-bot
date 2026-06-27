import {roundedRect} from '../utils/canvasUtil';
import {createCanvas, loadImage, registerFont} from 'canvas';
import {AttachmentBuilder, GuildMember} from 'discord.js';
import path from 'node:path';

registerFont(path.join(__dirname, '../../assets/fonts/Itim-Regular.ttf'), {family: 'TH-Custom'});

export async function generateCard(member: GuildMember, titleText: string): Promise<AttachmentBuilder> {
   const canvas = createCanvas(700, 250);
   const ctx = canvas.getContext('2d');

   try {
      const bgPath = path.join(__dirname, '../assets/images/beach_bg.png');
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
   } catch (error) {
      console.log(`Load image failed ${error}`);
      ctx.fillStyle = '#2c2f33';
      ctx.fillRect(0, 0, canvas.width, canvas.height); // when load image failed
   }

   // draw
   ctx.font = '28px "TH-Custom"';
   ctx.fillStyle = '#ffffff';
   ctx.fillText(titleText, 220, 90);

   ctx.font = 'bold 36px "TH-Custom"';
   ctx.fillStyle = '#ffffff';
   ctx.fillText(member.user.username, 220, 150);

   ctx.save(); // Draw pfp

   const x = 55;
   const y = 65;
   const width = 120;
   const height = 120;
   const radius = 20;

   // Rounded Square
   roundedRect(ctx, x, y, width, height, radius);

   ctx.clip();

   const avatarURL = member.user.displayAvatarURL({extension: 'jpg', size: 256});
   const avatar = await loadImage(avatarURL);
   ctx.drawImage(avatar, 55, 65, 120, 120);
   ctx.restore();

   return new AttachmentBuilder(canvas.toBuffer(), {name: 'card-image.png'});
}
