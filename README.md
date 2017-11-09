# Smooch Bot-to-agent Handoff Example

<iframe src="https://player.vimeo.com/video/242124581" width="640" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
<p><a href="https://vimeo.com/242124581">smooch-pipelines-with-smoochdesk</a> from <a href="https://vimeo.com/user72865062">Anastasi Theodore Bakolias</a> on <a href="https://vimeo.com">Vimeo</a>.</p>

## Purpose

This example project illustrates how to use Smooch's pipelines feature to coordinate a bot and a human agent (and attach interesting metadata to messages).

Smooch's messaging pipelines allow you to define a series of message processors running on an external host, which have the ability to attach metadata to messages before forwarding them to webhooks for final delivery.

An API user can define one or many processors to execute in a specified sequence (called a pipeline) in response to a user message. The API user first creates a processor telling Smooch the location of the server. The integrator may then add the processor to one or many pipelines, and choose in that order it executes relative to the other processors in the pipeline.

## Getting started

1. Clone this repo
2. `npm install`
3. Using _.env.example_ as a template create a _.env_ file
4. `npm start` to start the web server
5. Deploy this service on a proxy (such as ngrok)
6. Modify _pipeline_config.json_ to point to a series of complete URLs where webhooks can be sent to your processors. The defaults are
	- /processors/skip
	- /processors/echo
	- /processors/sentiment
	- /processors/dialog  which map to endpoints in _index.js_.
7. `npm run deploy` to deploy the pipline configuration to Smooch


You can inspect the configuration by running `npm run show`.
