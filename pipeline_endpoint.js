'use strict';

require('dotenv').config();

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const SMOOCH_ROOT = process.env.SMOOCH_ROOT;
const ACCOUNT_KEY_ID = process.env.SMOOCH_ACCOUNT_KEY_ID;
const ACCOUNT_SECRET = process.env.SMOOCH_ACCOUNT_SECRET;
const APP_ID = process.env.SMOOCH_APP_ID;
const BASE_URL = `${SMOOCH_ROOT}/v1/apps/${APP_ID}/middleware`;
const TOKEN = jwt.sign({
	scope: 'account'
}, ACCOUNT_SECRET, {
	header: {
		kid: ACCOUNT_KEY_ID
	}
});

async function request(method, endpoint, data) {
	const url = BASE_URL + endpoint;
	const options = {
		method,
		headers: {
			'Authorization': 'Bearer ' + TOKEN,
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
async function continueMessage(metadata, temporaryToken) {
	const url = 'https://app.smooch.io/v1/middleware/continue';
	await fetch(url, {
		method: 'post',
		body: JSON.stringify({
			metadata
		}),
		headers: {
			'Authorization': 'Bearer ' + temporaryToken,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
}

// getUserProps :: (userId) -> Promise({ properties })
async function getUserProps(userId) {
	const url = `https://app.smooch.io/v1/apps/${APP_ID}/appusers/${userId}`;
	const response = await fetch(url, {
		headers: {
			'Authorization': 'Bearer ' + TOKEN
		}
	});
	const data = await response.json();
	return data.appUser.properties;
}

// setUserProps :: (userId, properties) -> Promise()
async function setUserProps(userId, properties) {
	const url = `https://app.smooch.io/v1/apps/${APP_ID}/appusers/${userId}`;
	await fetch(url, {
		method: 'put',
		body: JSON.stringify({
			properties
		}),
		headers: {
			'Authorization': 'Bearer ' + TOKEN,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
}

// sendMessage :: (userId, text) -> Promise()
async function sendMessage(userId, text) {
	const url = `https://app.smooch.io/v1/apps/${APP_ID}/appusers/${userId}/messages`;
	await fetch(url, {
		method: 'post',
		body: JSON.stringify({
			text,
			type: 'text',
			role: 'appMaker',
			name: 'bot'
		}),
		headers: {
			'Authorization': 'Bearer ' + TOKEN,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
}

// listProcessors :: () -> Promise([ processorIds ])
async function listProcessors() {
	const data = await request('get', '/processors');
	return data.processors;
}

// deleteProcessor :: (processorId) -> Promise()
async function deleteProcessor(processorId) {
	await request('delete', `/processors/${processorId}`);
}

// createProcessor :: (target) -> Promise(processorSecret)
async function createProcessor(target) {
	const data = await request('post', '/processors', {
		target
	});
	return {
		id: data.processor._id,
		secret: data.processor.secret
	};
}

// getPipeline :: () -> Promise([ processors ])
async function getPipeline() {
	const data = await request('get', '/pipelines');
	return data.pipelines['appuser-message'];
}

// setPipeline :: (processors) -> Promise()
async function setPipeline(processors) {
	await request('put', '/pipelines/appuser-message', processors);
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
