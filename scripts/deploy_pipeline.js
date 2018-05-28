'use strict';

const smooch = require('../smooch_endpoint');
const config = require('../pipeline_config');

async function removeOldProcessors() {
	const processorIds = (await smooch.listProcessors()).map((processor) => processor._id);
	for (const processorId of processorIds) {
		console.log('delete processor', processorId);
		await smooch.deleteProcessor(processorId);
	}
}

async function addNewProcessors() {
	const ids = [];
	for (const endpoint of config.orderedEndpoints) {
		const data = await smooch.createProcessor(endpoint.target, endpoint.triggers);
		console.log('add new processors', data);
		ids.push(data.id);
	}

	return ids;
}

async function deployPipeline() {
	console.log('deploying smooch to Smooch');
	await removeOldProcessors();
	const processorIds = await addNewProcessors();
	await smooch.setPipeline(processorIds);
	console.log('deployment complete');
}

deployPipeline().catch(console.error).then(() => process.exit(0));
