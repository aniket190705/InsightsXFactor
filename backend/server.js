// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');

import express from "express"
import bodyParser from "body-parser";
import cors from "cors"

// Define LangflowClient Class
class LangflowClient {
    constructor(baseURL, applicationToken) {
        this.baseURL = baseURL;
        this.applicationToken = applicationToken;
    }

    async post(endpoint, body, headers = { "Content-Type": "application/json" }) {
        headers["Authorization"] = `Bearer ${this.applicationToken}`;
        headers["Content-Type"] = "application/json";
        const url = `${this.baseURL}${endpoint}`;

        console.log("Sending POST Request to:", url + "\n");
        console.log("Payload:", JSON.stringify(body) + "\n"); // Log the payload

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            const responseMessage = await response.json();
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(responseMessage)}`);
            }
            return responseMessage;
        } catch (error) {
            console.error('Request Error:', error.message);
            throw error;
        }
    }

    async initiateSession(flowId, langflowId, inputValue, inputType = 'chat', outputType = 'chat', stream = false, tweaks = {}) {
        const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
        return this.post(endpoint, { input_value: inputValue, input_type: inputType, output_type: outputType, tweaks: tweaks });
    }

    handleStream(streamUrl, onUpdate, onClose, onError) {
        const eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onUpdate(data);
        };

        eventSource.onerror = (event) => {
            console.error('Stream Error:', event);
            onError(event);
            eventSource.close();
        };

        eventSource.addEventListener('close', () => {
            onClose('Stream closed');
            eventSource.close();
        });

        return eventSource;
    }

    async runFlow(flowIdOrName, langflowId, inputValue, inputType = 'chat', outputType = 'chat', tweaks = {}, stream = false, onUpdate, onClose, onError) {
        try {
            const initResponse = await this.initiateSession(flowIdOrName, langflowId, inputValue, inputType, outputType, stream, tweaks);
            console.log('Init Response:', JSON.stringify(initResponse, null, 2) + "\n\n");


            if (stream && initResponse && initResponse.outputs && initResponse.outputs[0].outputs[0].artifacts.stream_url) {
                const streamUrl = initResponse.outputs[0].outputs[0].artifacts.stream_url;
                console.log(`Streaming from: ${streamUrl}`);
                this.handleStream(streamUrl, onUpdate, onClose, onError);
            }
            return initResponse;
        } catch (error) {
            console.error('Error running flow:', error);
            throw new Error('Error initiating session');
        }
    }
}

// Express.js Server
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all origins

// LangflowClient Setup
const flowIdOrName = '964117b6-5aa2-447b-bd81-905c5956a505';
const langflowId = '4fb42d99-af6b-4567-9df0-3cb6229d9f9c';
const applicationToken = 'AstraCS:sByTcdHvuTtHjLNXiJiYiuHf:f55674f041a82f0dd7b7040e1437951089c1a5a6599361487d905ec4d706e4d7';
const langflowClient = new LangflowClient('https://api.langflow.astra.datastax.com', applicationToken);

// API Endpoint
app.post('/runFlow', async (req, res) => {
    const { message } = req.body;
    console.log("Received Message:", message);
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const tweaks = {
            "ChatOutput-GU0Sp": {},
            "OpenAIModel-k4vcq": {},
            "ParseData-anmEq": {},
            "AstraDB-nAhCX": {},
            "ChatInput-WL0ho": {},
            "CombineText-xokFi": {},
            "TextInput-DIqPT": {},
            "File-iNjrv": {},
            "SplitText-DYGVc": {},
        };

        const response = await langflowClient.runFlow(
            flowIdOrName,
            langflowId,
            message,
            'chat',
            'chat',
            tweaks,
            false, // stream disabled
            (data) => console.log("Stream Received:", data.chunk), // onUpdate
            (msg) => console.log("Stream Closed:", msg), // onClose
            (err) => console.error("Stream Error:", err) // onError
        );

        if (response && response.outputs) {
            const flowOutputs = response.outputs[0];
            const firstComponentOutputs = flowOutputs.outputs[0];
            const output = firstComponentOutputs.outputs.message;

            console.log("Final Output:\n", output.message.text);
            res.json({ result: output.message.text });
        }
    } catch (error) {
        console.error('Error in Flow:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Langflow server running at http://localhost:${port}`);
});
