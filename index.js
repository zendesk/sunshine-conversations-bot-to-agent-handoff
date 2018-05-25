'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const pipeline = require('./pipeline_endpoint');

const PORT = process.env.PORT || 8000;


function processor(name, handlers) {
	return async function(req, res) {
		const metadata = {};
		let stop;

		try {
			const handler = handlers[req.body.trigger];
			if (handler) {
				stop = await handler(req.body, (newMetadata) => {
					Object.assign(metadata, newMetadata);
				});
			}
		} catch (error) {
			console.log(`${name} processor ERROR`, error.message);
		}

		if (!stop) {
			await pipeline.continueMessage(metadata, req.body.nonce);
		}

		res.end();
	};
}

const skipProcessor = processor('skip', {
	'message:appUser': async function(body, setMetadata) {
		if (body.message.metadata && body.message.metadata.ignore) {
			return;
		}

		const userProps = await pipeline.getUserProps(body.appUser._id);
		console.log({
			userProps
		});

		if (userProps.AGENT_SESSION) {
			setMetadata({
				ignore: true
			});
			return true;
		}
	}
});

const echoBotProcessor = processor('echo', {
	'message:appUser': async function(body) {
		if (body.message.metadata && body.message.metadata.ignore) {
			return;
		}

		await pipeline.sendMessage(body.appUser._id, `you said "${body.message.text}"`);
	}
});

const sentimentProcessor = processor('sentiment', {
	'message:appUser': async function(body, setMetadata) {
		setMetadata({
			sentimentScore: .5
		});
	}
});

const dialogProcessor = processor('dialog', {
	'message:appUser': async function(body) {
		if (body.message.metadata && body.message.metadata.ignore) {
			return;
		}

		if (body.message.text.indexOf('help') !== -1) {
			await pipeline.setUserProps(body.appUser._id, {
				AGENT_SESSION: true
			});
			await pipeline.sendMessage(body.appUser._id, 'Just a moment. Let me get a human');
		}
	}
});

function agentHandler(req, res) {
	// this endpoint simulates final delivery to agent interface
	console.log('Delivered', req.body.messages.map((message) => ({
		metadata: message.metadata,
		text: message.text
	})));
	res.end();
}


function validateSecret(req, res, next) {
	// TODO: validate secret in X-API-Key header
	next();
}

express()
	.use(morgan('tiny'))
	.use(express.static('public'))
	.use(bodyParser.json())
	.post('/processors/skip', validateSecret, skipProcessor)
	.post('/processors/echo', validateSecret, echoBotProcessor)
	.post('/processors/sentiment', validateSecret, sentimentProcessor)
	.post('/processors/dialog', validateSecret, dialogProcessor)
	.post('/agent', agentHandler)
	.listen(PORT, () => console.log(`Listening on port ${PORT}`));
