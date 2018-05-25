'use strict';

const smooch = require('../smooch_endpoint');
const config = require('../pipeline_config');

async function showPipeline() {
	console.log('Show smooch configuration \n\n');
	console.log('local config:', JSON.stringify(config, null, 2), '\n\n');
	const processorIds = await smooch.listProcessors();
	console.log('processors:', JSON.stringify(processorIds, null, 2), '\n\n');
	const pipelineData = await smooch.getPipeline();
	console.log('smooch:', JSON.stringify(pipelineData, null, 2), '\n\n');
}

try {
	showPipeline();
} catch (error) {
	console.log('ERROR', error);
}
