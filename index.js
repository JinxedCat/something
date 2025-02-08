const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Your bot token
const TOKEN = process.env.BOT_TOKEN;

// Channel ID to send reminders
const REMINDER_CHANNEL_ID = '1327460419660415089'; // Replace with your Discord channel ID

// Define your desired time zone (e.g., "America/New_York" or "Asia/Jakarta")
const TIMEZONE = 'America/New_York';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const reminders = [
        {
            name: 'Demonbend Abyss',
            schedule: '0 9 * * 1,3,5', // Monday, Wednesday, Friday at 9:00 AM
            end: '22:00',
        },
        {
            name: 'Sect Meditation',
            schedule: '0 9 * * 2,4', // Tuesday, Thursday at 9:00 AM
            end: '22:00',
        },
        {
            name: 'Otherworld Invasion',
            schedule: '0 9 * * 6,0', // Saturday, Sunday at 9:00 AM
            end: '22:00',
        },
        {
            name: 'World Apex',
            schedule: '0 15 * * 0', // Sunday at 3:00 PM
            end: null, // End time unknown
        },
    ];

    const sendReminder = (eventName, endTime) => {
        const channel = client.channels.cache.get(REMINDER_CHANNEL_ID);
        if (!channel) return console.error('Channel not found!');

        const embed = new EmbedBuilder()
            .setTitle(`${eventName} Reminder!`)
            .setDescription(
                `${eventName} has started! ${endTime ? `It will end at **${endTime}**.` : ''} 
                Don't forget to participate!`
            )
            .setColor('#FF5733')
            .setTimestamp();

        channel.send({ content: '@everyone', embeds: [embed] });
    };

    reminders.forEach((event) => {
        cron.schedule(
            event.schedule,
            () => {
                sendReminder(event.name, event.end);
            },
            {
                timezone: TIMEZONE, // Specify the desired time zone here
            }
        );
    });
});

client.login(TOKEN);