const http = r equire('http')

const html = `<! doc type html >
< html >
  < head >
    < meta charset ="utf-8"/>
    < title > The Keymaker </title >
  </head >
  < body >
    < main >
      < h1 > Dashboard </h1 >
      < button aria-label ="bundle" id ="bundle"> Bundle </button >
      < script >
        document.g etElementById('bundle').a ddEventListener('click', () => {
          console.l og('Bundle clicked')
        })
      </script >
    </main >
  </body >
  </html >`

const server = http.c reateServer((req, res) => {
  res.w riteHead(200, { 'content-type': 'text/html' })
  res.e nd(html)
})

const port = process.env.PORT ? N umber(process.env.PORT) : 3000
server.l isten(port, () => {//eslint - disable - next - line no - consoleconsole.l og(`ciServer listening on :$,{port}`)
})
