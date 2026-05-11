import { runKazakhstanThreadsBot } from "../core/bots/kazakhstanBot.js";

const result = await runKazakhstanThreadsBot();
console.log(JSON.stringify(result, null, 2));
