import {Client, ClientOptions, Collection, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder} from 'discord.js';
import {readdirSync} from 'node:fs';
import {join, parse} from 'node:path';

export interface Command {
   enable: boolean;
   data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
   execute(...args: unknown[]): Promise<void> | void;
}

export interface Event {
   enable: boolean;
   once?: boolean;
   execute(...args: unknown[]): Promise<void> | void;
}

export default class Bot extends Client {
   public readonly commands = new Collection<string, Command>();

   constructor(options: ClientOptions) {
      super(options);
   }

   public async start() {
      try {
         await Promise.all([this.registerEvents(), this.registerCommands()]);

         const token = process.env.TOKEN;

         if (!token) {
            throw new Error('Missing TOKEN');
         }

         this.rest.setToken(token);

         await this.login(token);
         await this.waitForReady();

         await this.deployCommands();

         console.log(`Logged in as ${this.user!.tag}`);
      } catch (err) {
         console.error('Failed to start bot:', err);
         throw err;
      }
   }

   private async waitForReady() {
      if (this.isReady()) {
         return;
      }

      await new Promise<void>(resolve => {
         this.once('ready', () => resolve());
      });
   }

   private getFiles(path: string) {
      return readdirSync(path).filter(file => /\.(ts|js)$/.test(file));
   }

   private async registerEvents() {
      const eventsPath = join(__dirname, '..', 'events');
      const files = this.getFiles(eventsPath);

      console.log(`Loading ${files.length} event(s)`);

      await Promise.all(
         files.map(async file => {
            try {
               const {default: event} = await import(join(eventsPath, file));

               if (!event?.enable) {
                  return;
               }

               const eventName = parse(file).name;
               const listener = (...args: unknown[]) => event.execute(...args);

               if (event.once) {
                  this.once(eventName, listener);
               } else {
                  this.on(eventName, listener);
               }
            } catch (err) {
               console.error(`Failed to load event ${file}`, err);
            }
         }),
      );
   }

   private async registerCommands() {
      const commandsPath = join(__dirname, '..', 'commands');
      const files = this.getFiles(commandsPath);

      console.log(`Loading ${files.length} command(s)`);

      await Promise.all(
         files.map(async file => {
            try {
               const {default: command} = await import(join(commandsPath, file));

               if (!command?.enable || !command.data) {
                  return;
               }

               this.commands.set(command.data.name, command);
            } catch (err) {
               console.error(`Failed to load command ${file}`, err);
            }
         }),
      );
   }

   private async deployCommands() {
      if (!this.user) {
         throw new Error('Client is not ready');
      }

      const body = this.commands.map(command => command.data.toJSON());

      await this.rest.put(Routes.applicationCommands(this.user.id), {body});

      console.log(`Deployed ${body.length} command(s)`);
   }
}
