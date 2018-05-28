'use strict';

require('dotenv').config();

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const SMOOCH_ROOT = process.env.SMOOCH_ROOT || 'https://api.smooch.io';
const ACCOUNT_KEY_ID = process.env.SMOOCH_ACCOUNT_KEY_ID;
const ACCOUNT_SECRET = process.env.SMOOCH_ACCOUNT_SECRET;
const APP_ID = process.env.SMOOCH_APP_ID;
const ACCOUNT_JWT = jwt.sign({
	scope: 'account'
}, ACCOUNT_SECRET, {
	header: {
		kid: ACCOUNT_KEY_ID
	}
});

async function request(method, endpoint, data, token) {
	const url = `${SMOOCH_ROOT}/v1/apps/${APP_ID}/${endpoint}`;
	token = token || ACCOUNT_JWT;
	const options = {
		method,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	const response = await fetch(url, options);

	if (response.status >= 400) {
		let message = `${method} ${url} failed: ${response.statusText}`;
		if (response.headers.get('content-type').startsWith('application/json')) {
			const json = await response.json();
			if (json.error && json.error.description) {
				message += `: ${json.error.description}`;
			}
		}
		throw new Error(message);
	}

	if (method === 'delete') {
		return;
	}

	return response.json();
}

// continueMessage :: (metadata, temporaryToken) -> Promise()
function continueMessage(metadata, temporaryToken) {
	return request('post', 'middleware/continue', {
		metadata
	}, temporaryToken);
}

// getUserProps :: (userId) -> Promise({ properties })
async function getUserProps(userId) {
	const data = await request('get', `appusers/${userId}`);
	return data.appUser.properties;
}

// setUserProps :: (userId, properties) -> Promise()
function setUserProps(userId, properties) {
	return request('put', `appusers/${userId}`, {
		properties
	});
}

// sendMessage :: (userId, text) -> Promise()
function sendMessage(userId, text) {
	return request('post', `appusers/${userId}/messages`, {
		text,
		type: 'text',
		role: 'appMaker',
		name: 'bot'
	});
}

// listProcessors :: () -> Promise([ processorIds ])
async function listProcessors() {
	const data = await request('get', 'middleware/processors');
	return data.processors;
}

// deleteProcessor :: (processorId) -> Promise()
async function deleteProcessor(processorId) {
	await request('delete', `middleware/processors/${processorId}`);
}

// createProcessor :: (target, triggers) -> Promise(processorSecret)
async function createProcessor(target, triggers) {
	const data = await request('post', 'middleware/processors', {
		target,
		triggers
	});
	return {
		id: data.processor._id,
		secret: data.processor.secret
	};
}

// getPipeline :: () -> Promise([ processors ])
async function getPipeline() {
	const data = await request('get', 'middleware/pipelines');
	return data.pipelines['appUser'];
}

// setPipeline :: (processors) -> Promise()
async function setPipeline(processors) {
	await request('put', 'middleware/pipelines/appuser', processors);
}

module.exports = {
	createProcessor,
	getPipeline,
	setPipeline,
	listProcessors,
	deleteProcessor,
	continueMessage,
	getUserProps,
	setUserProps,
	sendMessage
};
