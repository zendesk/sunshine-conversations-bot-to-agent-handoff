# Smooch Bot-to-agent Handoff Example

![screen shot 2017-11-09 at 3 20 30 pm](https://user-images.githubusercontent.com/2235885/32627755-902818ba-c561-11e7-8431-e757d98add45.png)

[Watch a demo](https://vimeo.com/user72865062)

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
