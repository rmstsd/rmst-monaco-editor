#!/usr/bin/env python

import asyncio
import websockets


wsHost = "localhost"
wsPort = 8765


async def hello(websocket):
    name = await websocket.recv()
    print(f"<<< {name}")

    greeting = f"Hello {name}!"

    await websocket.send(greeting)
    print(f">>> {greeting}")


async def main():
    async with websockets.serve(hello, wsHost, wsPort):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
