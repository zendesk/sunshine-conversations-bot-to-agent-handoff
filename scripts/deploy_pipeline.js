'use strict';

const pipeline = require('../pipeline_endpoint');
const config = require('../pipeline_config');

async function removeOldProcessors() {
	const processorIds = (await pipeline.listProcessors()).map((processor) => processor._id);
	for (const processorId of processorIds) {
		console.log('delete processor', processorId);
		await pipeline.deleteProcessor(processorId);
	}
}

async function addNewProcessors() {
	const ids = [];
	for (const endpoint of config.orderedEndpoints) {
		const data = await pipeline.createProcessor(endpoint);
		console.log('add new processors', data);
		ids.push(data.id);
	}

	return ids;
}

async function deployPipeline() {
	console.log('deploying pipeline to Smooch');
	await removeOldProcessors();
	const processorIds = await addNewProcessors();
	await pipeline.setPipeline(processorIds);
	console.log('deployment complete');
}

deployPipeline().catch(console.error).then(() => process.exit(0));
