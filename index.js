const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// DB
const db = new sqlite3.Database('./notes.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS notes (key TEXT PRIMARY KEY, content TEXT)`, (err) => {
    if (err) {
        console.error('Error creating notes table:', err.message);
    }
});

// Bot's token
const TOKEN = process.env.BOT_TOKEN;

// Channel IDs
const MINI_ANNOUNCEMENT_CID = '1339402520661065748'; 
const ANNOUNCEMENT_CID = '1328520612255109254';

// Timezone
const TIMEZONE = 'America/New_York';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const reminders = [
        {
            name: 'Demonbend Abyss',
            schedule: '0 9 * * 1,3,5',
            end: '22:00',
            channel: MINI_ANNOUNCEMENT_CID,
        },
        {
            name: 'Otherworld Invasion',
            schedule: '0 10 * * 6,0', 
            end: '22:00',
            channel: ANNOUNCEMENT_CID,
        },
        {
            name: 'World Apex',
            schedule: '0 15 * * 0', 
            end: null,
            channel: ANNOUNCEMENT_CID,
        },
        {
            name: 'Beast Invasion',
            schedule: '0 12 * * *', 
            end: null,
            channel: MINI_ANNOUNCEMENT_CID,
        },
        {
            name: 'Beast Invasion',
            schedule: '0 18 * * *', 
            end: null,
            channel: MINI_ANNOUNCEMENT_CID,
        },
        {
            name: 'Sect Clash',
            schedule: '0 15 * * 6', 
            end: '15:15',
            channel: ANNOUNCEMENT_CID,
        },
    ];

    const sendReminder = (eventName, endTime, channelId) => {
        const channel = client.channels.cache.get(channelId);
        if (!channel) return console.error('Channel not found!');

        const embed = new EmbedBuilder()
            .setTitle(`${eventName} Reminder!`)
            .setDescription(
                `${eventName} has started! ${endTime ? `It will end at **${endTime}**.` : ''} 
                Don't forget to participate!`
            )
            .setColor('#FF5733')
            .setTimestamp();

        channel.send({ content: '<@&1328520902509330443>', embeds: [embed] });
    };

    reminders.forEach((event) => {
        cron.schedule(
            event.schedule,
            () => {
                sendReminder(event.name, event.end, event.channel);
            },
            {
                timezone: TIMEZONE, 
            }
        );
    });
});

client.login(TOKEN);
