import redis from '../redis';
import Parser from 'rss-parser';

const parser = new Parser();

export async function getLatestVideo(channelId: string) {
   const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);

   return feed.items[0];
}

export async function getLastVideoId(channelId: string) {
   return redis.hget('youtube:last_video', channelId);
}

export async function setLastVideoId(channelId: string, videoId: string) {
   await redis.hset('youtube:last_video', channelId, videoId);
}
