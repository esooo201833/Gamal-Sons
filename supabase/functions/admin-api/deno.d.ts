declare namespace Deno {
  function serve(handler: (request: Request) => Response | Promise<Response>): void

  const env: {
    get(name: string): string | undefined
  }
}
