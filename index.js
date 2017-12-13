'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const pipeline = require('./pipeline_endpoint');

const PORT = process.env.PORT || 8000;

express()
    .use(express.static('public'))
    .use(bodyParser.json())
    .post('/processors/skip', validateSecret, determineIfHandle, skipProcessor)
    .post('/processors/echo', validateSecret, determineIfHandle, echoBotProcessor)
    .post('/processors/sentiment', validateSecret, sentimentProcessor)
    .post('/processors/dialog', validateSecret, determineIfHandle, dialogProcessor)
    .post('/agent', agentHandler)
    .listen(PORT, () => console.log(`Listening on port ${PORT}`));


function agentHandler(req, res) {
    // this endpoint simulates final delivery to agent interface
    console.log('Delivered', req.body.messages.map((message) => ({metadata: message.metadata, text: message.text })));
    res.end();
}


async function skipProcessor(req, res) {
    console.log('skipProcessor', req.body);
    try {
        if (req.body.message && req.body.appUser) {
            const userProps = await pipeline.getUserProps(req.body.appUser._id);

            console.log({ userProps });
            const ignore = userProps.AGENT_SESSION == 'HANDLING';

            await pipeline.continueMessage(Object.assign((req.body.message.metadata || {}), { ignore }), req.body.nonce);
            res.end();
            return;
        }

    } catch (error) {
        console.error('skipProcessor ERROR', error);
    }

    await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
    res.end();
}


async function echoBotProcessor(req, res) {
    console.log('echoBotProcessor', req.body.message.metadata);
    try {
        await pipeline.sendMessage(req.body.appUser._id, `you said "${req.body.message.text}"`);
    } catch (error) {
        console.log('echoBotProcessor ERROR', error);
    }

    await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
    res.end();
}


async function sentimentProcessor(req, res) {
    console.log('sentimentProcessor', req.body.message.metadata);
    try {
        if (req.body.message) {
            console.log('continue with sentiment decoration');
            await pipeline.continueMessage(Object.assign((req.body.message.metadata || {}), {
                sentimentScore: .5
            }), req.body.nonce);
            res.end();
            return;
        }
    } catch (error) {
        console.error('sentimentProcessor ERROR', error);
    }

    await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
    res.end();
}


async function dialogProcessor(req, res) {
    console.log('dialogProcessor', req.body.message.metadata);
    if (req.body.message.text.indexOf('help') !== -1) {
        try {
            await pipeline.setUserProps(req.body.appUser._id, { AGENT_SESSION: 'WAITING' });
            console.log('Setting AGENT_SESSION = true, so all further messages will be ignored.');
            await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
            await pipeline.sendMessage(req.body.appUser._id, 'Just a moment. Let me get a human');

        } catch (error) {
            console.log('dialogProcessor ERROR', error);
        }
    }
    res.end();


}


async function determineIfHandle(req, res, next) {
    console.log('determineIfHandle', req.body.message.metadata, req.url);
    if (req.body.message && req.body.message.metadata && req.body.message.metadata.ignore) {
        console.log('metadata.ignore = true found');
        try {
            await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
            res.end();
            return;
        } catch (error) {
            console.error('determineIfHandle ERROR', error);
        }
    }
    console.log(next);
    next();
}


function validateSecret(req, res, next) {
    // TODO: validate secret in X-API-Key header
    next();
}

