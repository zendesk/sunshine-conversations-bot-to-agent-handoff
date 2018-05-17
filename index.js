'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const pipeline = require('./pipeline_endpoint');

const PORT = process.env.PORT || 8000;

express()
	.use(morgan('tiny'))
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
	try {
		const userProps = await pipeline.getUserProps(req.body.appUser._id);
		console.log({ userProps });

		if (userProps.AGENT_SESSION) {
			await pipeline.continueMessage(Object.assign((req.body.message.metadata || {}), { ignore: true }), req.body.nonce);
			res.end();
			return;
		}

	} catch (error) {
		console.log('skipProcessor ERROR', error.message);
	}

	await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
	res.end();
}


async function echoBotProcessor(req, res) {
	try {
		await pipeline.sendMessage(req.body.appUser._id, `you said "${req.body.message.text}"`);
	} catch (error) {
		console.log('echoBotProcessor ERROR', error);
	}

	await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
	res.end();
}


async function sentimentProcessor(req, res) {
	try {
		await pipeline.continueMessage(Object.assign((req.body.message.metadata || {}), {
			sentimentScore: .5
		}), req.body.nonce);
		res.end();
		return;
	} catch (error) {
		console.log('sentimentProcessor ERROR', error);
	}

	await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
	res.end();
}


async function dialogProcessor(req, res) {
	if (req.body.message.text.indexOf('help') !== -1) {
		try {
			await pipeline.setUserProps(req.body.appUser._id, { AGENT_SESSION: true });
			await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
			await pipeline.sendMessage(req.body.appUser._id, 'Just a moment. Let me get a human');
		} catch (error) {
			console.log('dialogProcessor ERROR', error);
		}
	}

	res.end();
}


async function determineIfHandle(req, res, next) {
	if (req.body.message.metadata && req.body.message.metadata.ignore) {
		try {
			await pipeline.continueMessage(req.body.message.metadata, req.body.nonce);
			res.end();
			return;
		} catch (error) {
			console.log('determineIfHandle ERROR', error);
		}
	}

	next();
}


function validateSecret(req, res, next) {
	// TODO: validate secret in X-API-Key header
	next();
}

