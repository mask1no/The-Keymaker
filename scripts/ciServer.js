const http = r e quire('http') const html = `<!doc type html>
<html> <head> <meta charset ="utf-8"/> <title> The Keymaker </title> </head> <body> <main> <h1> Dashboard </h1> <button aria-label ="bundle" id ="bundle"> Bundle </button> <script> document.g e tElementById('bundle').a d dEventListener('click', () => { console.log('Bundle clicked')
  }) </script> </main> </body> </html>` const server = http.c r eateServer((req, res) => { res.w r iteHead(200, { 'content-type': 'text/html' }) res.e n d(html)
  }) const port = process.env.PORT ? N u mber(process.env.PORT) : 3000
server.l i sten(port, () => {//eslint - disable - next - line no - consoleconsole.log(`ciServer listening on :${port}`)
  })
