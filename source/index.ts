import discord, { Message } from 'discord.js';
import configurationFile from '../config.json';
import gas_jokes from './gas_jokes';

import nfetch from 'node-fetch';
import { v4 } from 'uuid';

const botToken = configurationFile.BOT_TOKEN;
const easterEgg = configurationFile.IMG_EASTER_EGG;
let responseThumb = configurationFile.RESPONSE_THUMB;
let responseThumbError = configurationFile.RESPONSE_THUMB_ERROR;

const client = new discord.Client();

//wei -> gwei: wei / (10 ** 9) | 1 gwei = 1 * 10^9 wei
const toWei = (value: number): String => {
    const wei = Math.floor(value / (10 ** 9));
    return wei.toString();
};

client.on('message', async (m) => {

    if (m.author.bot) return;

    if(!m.content.startsWith('/')) return;

    switch (m.content) {
        case '/gas':
            m.channel.startTyping();
            await fetchCurrentGas()
                .then(response => response.json())
                .then((json) => {
                    //serialize
                    m.reply(embeds.success(toWei(json.data.slow), toWei(json.data.standard), toWei(json.data.fast), toWei(json.data.rapid)));
                    m.channel.stopTyping();
                })
                .catch((err) => {
                    console.info(err);
                    m.reply(embeds.error());
                    m.channel.stopTyping();
                });
            break;
        default:
    }
});

const fetchCurrentGas = async (): Promise<any> => {

    // no caching
    const _headers = {
        pragma: 'no-cache',
        cacheControl: 'no-cache'
    };

    const datapoint = `https://www.gasnow.org/api/v3/gas/price?utm_source=${configurationFile.NOT_NAME}-${v4()}`;
    
    return nfetch(datapoint, {method: 'GET', headers: _headers})
};

const embeds = {
    success: (slow: String, standard: String, fast: String, rapid: String): discord.MessageEmbed => {

        // random joke easter eggs
        const randJoke = randomJoke();

        // change thumbnail to elder Vitalik Buterin
        if (randJoke == "\"Gas fees will be cheaper with ETH 2.0!\" -- Vitalik Buterin (circa 2065)\"") {
            responseThumb = easterEgg.ELDER_VITALIK;
        }

        return new discord.MessageEmbed()
            .setColor('#00D166')
            .setTitle('Current Etherem Gas Prices')
            .setAuthor('Gas Price Bot')
            .setDescription(randJoke)
            .addFields(
                {name: 'Slow 🐌', value: `${slow} gwei`, inline: true},
                {name: 'Standard 🚗', value: `${standard} gwei`, inline: true},
                {name: 'Fast 🛩', value: `${fast} gwei`, inline: true},
                {name: 'Rapid 🚀', value: `${rapid} gwei`, inline: true},
            )
            .setThumbnail(responseThumb)
            .setTimestamp()
            .setFooter('data obtained now from gasnow.org');
    },
    error: (): discord.MessageEmbed => {
        return new discord.MessageEmbed()
        .setColor('#F93A2F')
        .setTitle('There was an error.')
        .setAuthor('Gas Price Bot')
        .setDescription('I couldn\'t get the latest gas prices. Try again.')
        .setThumbnail(responseThumbError)
        .setFooter('bip bop: 🤖 encountered an error, report to master!');
    }
};

const randomJoke = (): String => gas_jokes[Math.floor((Math.random() * gas_jokes.length))];

client.login(botToken);