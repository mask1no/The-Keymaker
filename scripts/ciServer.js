const http = require('http')

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>The Keymaker</title>
  </head>
  <body>
    <main>
      <h1>Dashboard</h1>
      <button aria-label="bundle" id="bundle">Bundle</button>
      <script>
        document.getElementById('bundle').addEventListener('click', () => {
          console.log('Bundle clicked')
        })
      </script>
    </main>
  </body>
  </html>`

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(html)
})

const port = process.env.PORT ? Number(process.env.PORT) : 3000
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ciServer listening on :${port}`)
})


