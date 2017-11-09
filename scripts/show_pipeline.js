'use strict';

const pipeline = require('../pipeline_endpoint');
const config = require('../pipeline_config');

async function showPipeline() {
	console.log('Show pipeline configuration \n\n');
	console.log('local config:', JSON.stringify(config, null, 2), '\n\n');
	const processorIds = await pipeline.listProcessors();
	console.log('processors:', JSON.stringify(processorIds, null, 2), '\n\n');
	const pipelineData = await pipeline.getPipeline();
	console.log('pipeline:', JSON.stringify(pipelineData, null, 2), '\n\n');
}

try {
	showPipeline();
} catch (error) {
	console.log('ERROR', error);
}
