// server.js

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
	console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

	res.setHeader('Content-Type', 'application/json');

	if (req.url === '/api/' && req.method === 'GET') {
		return res.end(
			JSON.stringify({
				message: 'Hello from Node.js!',
				timestamp: new Date().toISOString(),
			}),
		);
	}

	if (req.url === '/api/health' && req.method === 'GET') {
		return res.end(
			JSON.stringify({
				status: 'ok',
				server: PORT,
			}),
		);
	}

	res.statusCode = 404;
	res.end(
		JSON.stringify({
			error: 'Not Found',
		}),
	);
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
