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

// C_ID
const C_ID = '1327460419660415089'; 

// Timezone
const TIMEZONE = 'America/New_York';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const reminders = [
        {
            name: 'Demonbend Abyss',
            schedule: '0 9 * * 1,3,5',
            end: '22:00',
        },
        {
            name: 'Sect Meditation',
            schedule: '0 9 * * 2,4',
            end: '22:00',
        },
        {
            name: 'Otherworld Invasion',
            schedule: '0 10 * * 6,0', 
            end: '22:00',
        },
        {
            name: 'World Apex',
            schedule: '0 15 * * 0', 
            end: null,
        },
        {
            name: 'Beast Invasion',
            schedule: '0 12 * * *', 
            end: null,
        },
        {
            name: 'Beast Invasion',
            schedule: '0 18 * * *', 
            end: null,
        },
        {
            name: 'Sect Clash',
            schedule: '0 15 * * 6', 
            end: '15:15',
        },
    ];

    const sendReminder = (eventName, endTime) => {
        const channel = client.channels.cache.get(C_ID);
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
                timezone: TIMEZONE, 
            }
        );
    });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Echo command
    if (message.content.startsWith('echo ')) {
        const contentToEcho = message.content.slice(5).trim();

        if (contentToEcho) {
            const embed = new EmbedBuilder()
                .setDescription(contentToEcho)
                .setColor('#00FF00');

            await message.channel.send({ embeds: [embed] });
            await message.delete();
        }
    }

    // Ping pong
    if (message.content === 'ping') {
        const ping = client.ws.ping;
        const embed = new EmbedBuilder()
            .setTitle('Pong!')
            .setDescription(`Bot Latency: **${ping}ms**`)
            .setColor('#00FF00');

        await message.channel.send({ embeds: [embed] });
    }

    // Notes
    if (message.content.startsWith('note ')) {
        const args = message.content.slice(5).trim().split(' ');
        const noteKey = args.shift();
        const noteContent = args.join(' ');

        if (!noteKey || !noteContent) {
            return message.reply('Please provide a key and content for the note.');
        }

        const contentToSave = message.attachments.size > 0 ? message.attachments.first().url : noteContent;

        db.run(
            `INSERT OR REPLACE INTO notes (key, content) VALUES (?, ?)`,
            [noteKey, contentToSave],
            (err) => {
                if (err) {
                    return message.reply('Error saving note to database.');
                }
                message.reply(`Saved note under key: **${noteKey}**`);
            }
        );
    }

    // Fetch notes
    if (message.content.startsWith('fetch ')) {
        const noteKey = message.content.slice(6).trim();

        db.get(`SELECT content FROM notes WHERE key = ?`, [noteKey], (err, row) => {
            if (err) {
                return message.reply('Error fetching note from database.');
            }

            if (!row) {
                return message.reply('No note found with that key.');
            }

            const embed = new EmbedBuilder()
                .setTitle(`Note: ${noteKey}`)
                .setDescription(row.content)
                .setColor('#00FF00');

            message.channel.send({ embeds: [embed] });
        });
    }

    // Notes list
    if (message.content === 'note-list') {
        db.all(`SELECT key FROM notes`, [], (err, rows) => {
            if (err) {
                return message.reply('Error retrieving notes from database.');
            }

            const keys = rows.map((row) => row.key);
            const embed = new EmbedBuilder()
                .setTitle('Saved Notes')
                .setDescription(keys.length > 0 ? keys.join(', ') : 'No notes saved.')
                .setColor('#00FF00');

            message.channel.send({ embeds: [embed] });
        });
    }
});

client.login(TOKEN);

// Close the database when the process ends
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err.message);
        }
        console.log('Database connection closed.');
    });
});
