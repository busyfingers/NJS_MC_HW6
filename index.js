/**
 * Main file for the API
 */

// Dependencies
const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const cluster = require("cluster");
const os = require("os");

// Config
const serverPort = 1337;

// Instantiate the server
let server = http.createServer((req, res) => {
    // Parse the requested URL and the query string as an object
    let parsedUrl = url.parse(req.url);

    // Get the payload if there is any
    let decoder = new StringDecoder("utf-8");
    let buffer = "";

    // Catch incoming payload stream
    req.on("data", (data) => {
        buffer += decoder.write(data);
    });

    // Detect end of stream and process request
    req.on("end", () => {
        buffer += decoder.end();

        // Define object containing various data from the request
        let receivedData = {
            "path": parsedUrl.pathname.replace(/^\/+|\/+$/g, ""),
            "method": req.method.toUpperCase(),
            "headers": req.headers,
            "payload": buffer
        };

        // Decide which handler to use
        let handler = typeof(router[receivedData.path]) == "undefined" ? handlers.notFound : router[receivedData.path];

        handler(receivedData, (statusCode, responseData) => {
            // Get status code from handler, default to 500
            statusCode = typeof(statusCode) == "number" ? statusCode : 500;
            
            // Get the response data from handler, default to empty object
            responseData = typeof(responseData) == "object" ? responseData : {};

            // Convert the payload to a string
            let response  = JSON.stringify(responseData);

            // Return the response
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(response);

            console.log(`Returning status code ${statusCode} with data: ${response}`);
        });
    });
});

// Define handlers
let handlers = {};

// "Not Found"/404 handler
handlers.notFound = (data, callback) => {
    callback(404, { "message" : `Invalid request, path ${data.path} doesn't exist`});
}

// "Hello" handler
handlers.hello = (data, callback) => {
    console.log("Recieved incoming request: ", data);

    let response = {};
    let statusCode = 400;

    // If use made a POST request and actually sent something, then return the welcome message
    if (data.method === 'POST' && data.payload !== "") {
        response = { "message" : `Welcome to the server at port ${serverPort}`};
        statusCode = 200;
    }

    callback(statusCode, response);
}

// Define router
let router = {
    "hello" : handlers.hello
};

let startServerInstance = threadId => {
    // Start the server
    server.listen(serverPort, () => {
        console.log(`Worker: ${threadId} -- Listening on port ${serverPort}`)
    });
};

// Initialize the server and spawn the workers
(_initServer = _ => {
    if (cluster.isMaster) {
        // Spawn one worker/fork per cpu core
        for (let n = 0; n < os.cpus().length; n++) {
            cluster.fork();
        }
    } else {
        // Start the server on the worker(s)
        startServerInstance(cluster.worker.id);
    }
})();
